import React, { useEffect, useState } from 'react';

export default function LoadingComponent({ size = 50, light = false, fullscreen = false }) {
	useEffect(() => {}, []);

	const spinner = light ? (
		<div
			className={`border-blue-600 h-[${size}px] w-[${size}px] animate-spin rounded-full border-[5px] border-t-transparent`}
		/>
	) : (
		<div
			className={`border-white h-[${size}px] w-[${size}px] animate-spin rounded-full border-[5px] border-t-transparent`}
		/>
	);

	if (fullscreen) {
		return (
			<div className="flex min-h-screen w-full items-center justify-center bg-gray-50">
				{spinner}
			</div>
		);
	}

	return spinner;
}
