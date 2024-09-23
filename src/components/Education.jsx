import React from "react";
import image1 from "../../public/education-1.png";
import image2 from "../../public/education-2.png";
import image3 from "../../public/education-3.png";
const Education = () => {
  return (
    <div className="space-y-3 " id="education">
      <h2 className="text-xl font-bold">Education</h2>
      <div className="flex items-center gap-5">
        <img src={image1} alt="" className="w-14 border rounded-full" />
        <div className="flex items-center justify-between flex-1">
          <div className="flex flex-col">
            <h3 className="font-semibold">
              University Politehnica of Timisoara
            </h3>
            <span className="font-medium text-gray-500 text-sm">
              Master's degree (Automotive Embedded Systems)
            </span>
          </div>
          <div className="text-gray-400">October 2019 - June 2022</div>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <img src={image2} alt="" className="w-14 border rounded-full" />
        <div className="flex items-center justify-between flex-1">
          <div className="flex flex-col">
            <h3 className="font-semibold">
              University Politehnica of Timisoara
            </h3>
            <span className="font-medium text-gray-500 text-sm">
              Bachelor's Degree at Faculty of Automotion and Computer Science
            </span>
          </div>
          <div className="text-gray-400">October 2016 - June 2019</div>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <img src={image3} alt="" className="w-14 border rounded-full" />
        <div className="flex items-center justify-between flex-1">
          <div className="flex flex-col">
            <h3 className="font-semibold">
              {" "}
              Mihai Eminescu National College of Petrosani
            </h3>
            <span className="font-medium text-gray-500 text-sm">
              IT intensive
            </span>
          </div>
          <div className="text-gray-400">September 2012 - July 2016</div>
        </div>
      </div>
    </div>
  );
};

export default Education;
