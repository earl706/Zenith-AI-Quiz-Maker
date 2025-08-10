import fs from 'fs';
import path from 'path';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
import * as t from '@babel/types';

const traverse = traverseModule.default;
const rootDir = path.resolve('./src');
const outputFile = 'PROJECT_DOCS.txt';

const ignoreExts = ['.png', '.jpg', '.jpeg', '.svg', '.gif', '.css', '.scss'];
const validExts = ['.js', '.jsx', '.ts', '.tsx'];

let markdown = `# Project Documentation\n\n## Project Structure\n\n`;

// Recursively scan files
function scanDir(dir, indent = 0) {
	const entries = fs.readdirSync(dir, { withFileTypes: true });
	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		const relPath = path.relative(rootDir, fullPath);
		const ext = path.extname(entry.name);

		if (entry.isDirectory()) {
			markdown += `${'    '.repeat(indent)}${entry.name}/**\n`;
			scanDir(fullPath, indent + 1);
		} else if (validExts.includes(ext)) {
			markdown += `${'    '.repeat(indent)}${entry.name}\n`;
			extractDetails(fullPath, indent + 1);
		}
	}
}

// Extract imports, components, functions, states, and variables
function extractDetails(filePath, indent) {
	try {
		const content = fs.readFileSync(filePath, 'utf-8');
		const ast = parse(content, {
			sourceType: 'module',
			plugins: ['jsx', 'typescript']
		});

		let found = false;

		// Imports
		let importLines = [];
		traverse(ast, {
			ImportDeclaration(path) {
				const source = path.node.source.value;
				const specifiers = path.node.specifiers.map((spec) => {
					if (t.isImportDefaultSpecifier(spec)) return spec.local.name;
					if (t.isImportSpecifier(spec)) return spec.imported.name;
					if (t.isImportNamespaceSpecifier(spec)) return `* as ${spec.local.name}`;
				});
				importLines.push(`- ${source}: ${specifiers.join(', ')}`);
			}
		});
		if (importLines.length > 0) {
			markdown += `${'    '.repeat(indent)}Imports:\n`;
			importLines.forEach((line) => {
				markdown += `${'    '.repeat(indent + 1)}${line}\n`;
			});
			found = true;
		}

		// Components, functions, states, variables
		traverse(ast, {
			// Function and Component Detection
			FunctionDeclaration(path) {
				const name = path.node.id.name;
				const params = path.node.params.map((p) => p.name || 'unknown');
				const returns = getReturnValues(path);
				markdown += `${'    '.repeat(indent)}Function: \`${name}(${params.join(', ')})\` — returns: ${returns}\n`;
				found = true;
			},
			VariableDeclarator(path) {
				if (t.isIdentifier(path.node.id)) {
					const name = path.node.id.name;
					if (
						t.isArrowFunctionExpression(path.node.init) ||
						t.isFunctionExpression(path.node.init)
					) {
						const params = path.node.init.params.map((p) => p.name || 'unknown');
						const returns = getReturnValues(path);
						markdown += `${'    '.repeat(indent)}Function: \`${name}(${params.join(', ')})\` — returns: ${returns}\n`;
						found = true;
					} else if (
						t.isArrayPattern(path.node.id) &&
						t.isCallExpression(path.node.init) &&
						t.isIdentifier(path.node.init.callee, { name: 'useState' })
					) {
						const stateVar = path.node.id.elements[0]?.name;
						markdown += `${'    '.repeat(indent)}State: \`${stateVar}\`\n`;
						found = true;
					} else {
						markdown += `${'    '.repeat(indent)}Variable: \`${name}\`\n`;
						found = true;
					}
				}
			}
		});

		if (!found) {
			markdown += `${'    '.repeat(indent)}- _(no significant items found)_\n`;
		}
	} catch (err) {
		markdown += `${'    '.repeat(indent)}⚠️ Error parsing file: ${err.message}\n`;
		markdown += `${'    '.repeat(indent)}- _(no significant items found)_\n`;
	}
}

// Helper: Get return values
function getReturnValues(path) {
	const returns = [];
	path.traverse({
		ReturnStatement(returnPath) {
			if (returnPath.node.argument) {
				if (t.isIdentifier(returnPath.node.argument)) {
					returns.push(returnPath.node.argument.name);
				} else if (t.isLiteral(returnPath.node.argument)) {
					returns.push(JSON.stringify(returnPath.node.argument.value));
				} else {
					returns.push(returnPath.node.argument.type);
				}
			}
		}
	});
	return returns.length > 0 ? returns.join(', ') : 'void';
}

// Run
scanDir(rootDir);

// Save file
fs.writeFileSync(outputFile, markdown, 'utf-8');
console.log(`✅ Documentation generated: ${outputFile}`);
