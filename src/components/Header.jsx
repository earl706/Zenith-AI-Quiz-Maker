import React, { useState } from "react";
import { faBell, faMessage } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import displayPicture from "/src/assets/DP.jpg";

export default function Header({ page }) {
  const [userName, setUserName] = useState("Earl Benedict C. Dumaraog");
  const [userID, setUserID] = useState("2021309235");

  return (
    <div className="flex justify-between items-center mb-[40px]">
      <div className="flex justify-between items-center w-[67%]">
        <div className="flex flex-col gap-0">
          <div className="text-[13px]">
            <span className="text-[#6F8055]">Pages / </span>
            <span className="font-semibold">{page}</span>
          </div>
          <span className="text-[#6F8055] text-[40px] font-extrabold">
            {page}
          </span>
        </div>
        <div className="flex justify-end gap-[20px]">
          <div className="flex items-center justify-center h-[35px] w-[35px] rounded-full">
            <FontAwesomeIcon icon={faBell} />
          </div>
          <div className="flex items-center justify-center h-[35px] w-[35px] rounded-full">
            <FontAwesomeIcon icon={faMessage} />
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-[12px]">
        <div className="flex flex-col justify-start items-end">
          <span className="text-[13px]">{userName}</span>
          <span className="text-[10px] text-[#A1A1A1]">{userID}</span>
        </div>
        <div className="h-[40px] w-[40px] rounded-full">
          <img
            src={displayPicture}
            alt=""
            className="h-[40px] w-[40px] object-cover rounded-full"
          />
        </div>
      </div>
    </div>
  );
}
