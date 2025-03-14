import React, { useEffect, useState } from "react";

export default function LoadingComponent({ size, light }) {
  useEffect(() => {}, []);

  return light ? (
    <>
      <div
        className={`border-blue-600 h-[${size}px] w-[${size}px] border-[5px] animate-spin rounded-full border-t-transparent`}
      />
    </>
  ) : (
    <>
      <div
        className={`border-white h-[${size}px] w-[${size}px] border-[5px] animate-spin rounded-full border-t-transparent`}
      />
    </>
  );
}
