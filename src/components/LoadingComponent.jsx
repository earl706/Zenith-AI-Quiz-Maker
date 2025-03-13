import React, { useEffect } from "react";

export default function LoadingComponent({ size, light }) {
  useEffect(() => {}, []);

  return light ? (
    <>
      <div
        className={`border-blue-600 h-[30px] w-[30px] border-[4px] animate-spin rounded-full border-t-transparent`}
      />
    </>
  ) : (
    <>
      <div
        className={`border-white h-[30px] w-[30px] border-[4px] animate-spin rounded-full border-t-transparent`}
      />
    </>
  );
}
