import React from "react";
import logo1 from "../../public/1.png";
import logo2 from "../../public/2.png";
import logo3 from "../../public/3.png";

const Experience = () => {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold">Work Experience</h2>
      <div className="flex items-center gap-5">
        <img src={logo1} alt="" className="w-14 border rounded-full" />
        <div className="flex items-center justify-between flex-1">
          <div className="flex flex-col">
            <h3 className="font-semibold">Company 1</h3>
            <span className="font-medium text-gray-500 text-sm">
              Web Development Internship
            </span>
          </div>
          <div className="text-gray-400">July 2022 - Present</div>
        </div>
      </div>
      <h2 className="text-xl font-bold"></h2>
      <div className="flex items-center gap-5">
        <img src={logo2} alt="" className="w-14 border rounded-full" />
        <div className="flex items-center justify-between flex-1">
          <div className="flex flex-col">
            <h3 className="font-semibold">Company 1</h3>
            <span className="font-medium text-gray-500 text-sm">
              Web Development Internship
            </span>
          </div>
          <div className="text-gray-400">January 2022 - July 2022</div>
        </div>
      </div>
      <h2 className="text-xl font-bold"></h2>
      <div className="flex items-center gap-5">
        <img src={logo3} alt="" className="w-14 border rounded-full" />
        <div className="flex items-center justify-between flex-1">
          <div className="flex flex-col">
            <h3 className="font-semibold">Company 1</h3>
            <span className="font-medium text-gray-500 text-sm">
              Web Development Internship
            </span>
          </div>
          <div className="text-gray-400">March 2020 - November 2021</div>
        </div>
      </div>
    </div>
  );
};

export default Experience;
