import fs from 'fs';
import path from 'path';
import * as babelParser from '@babel/parser';
import traverseModule from '@babel/traverse';

const traverse = traverseModule.default || traverseModule;

const code = fs.readFileSync(path.resolve('./src/main.jsx'), 'utf-8');
const ast = babelParser.parse(code, {
	sourceType: 'module',
	plugins: ['jsx']
});

traverse(ast, {
	ImportDeclaration(path) {
		console.log('Import from:', path.node.source.value);
	}
});
