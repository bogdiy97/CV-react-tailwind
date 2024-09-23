import React from "react";

const Skills = () => {
  return (
    <div className="flex flex-col gap-5">
      <h2 className="font-bold text-xl">Skills</h2>
      <div className="flex gap-3 flex-wrap">
        <div className="flex flex-col item-start justify-center gap-2">
          <div className="py-2 px-5 border-none text-white font-semibold rounded-xl hover:opacity-75 bg-gradient-to-r from-red-500 to-orange-500">
            JavaScript
          </div>
          <div className="py-2 px-5 border-none text-white font-semibold rounded-xl hover:opacity-75 bg-gradient-to-r from-emerald-500 to-green-500">
            Html
          </div>
          <div className="py-2 px-5 border-none text-white font-semibold rounded-xl hover:opacity-75 bg-gradient-to-r from-blue-500 to-sky-500">
            Css
          </div>
        </div>
        <div className="flex flex-col item-start justify-center gap-2">
          <div className="py-2 px-5 border-none text-white font-semibold rounded-xl hover:opacity-75 bg-gradient-to-r from-red-500 to-orange-500">
            SQL
          </div>
          <div className="py-2 px-5 border-none text-white font-semibold rounded-xl hover:opacity-75 bg-gradient-to-r from-emerald-500 to-green-500">
            React.js
          </div>
          <div className="py-2 px-5 border-none text-white font-semibold rounded-xl hover:opacity-75 bg-gradient-to-r from-blue-500 to-sky-500">
            TailswindCss
          </div>
        </div>
        <div className="flex flex-col item-start justify-center gap-2">
          <div className="py-2 px-5 border-none text-white font-semibold rounded-xl hover:opacity-75 bg-gradient-to-r from-red-500 to-orange-500">
            C
          </div>
          <div className="py-2 px-5 border-none text-white font-semibold rounded-xl hover:opacity-75 bg-gradient-to-r from-emerald-500 to-green-500">
            C embedded
          </div>
          <div className="py-2 px-5 border-none text-white font-semibold rounded-xl hover:opacity-75 bg-gradient-to-r from-blue-500 to-sky-500">
            Vue.js
          </div>
        </div>
        <div className="flex flex-col item-start justify-center gap-2">
          <div className="py-2 px-5 border-none text-white font-semibold rounded-xl hover:opacity-75 bg-gradient-to-r from-black to-red-500">
            Git
          </div>
          <div className="py-2 px-5 border-none text-white font-semibold rounded-xl hover:opacity-75 bg-gradient-to-r from-emerald-500 to-green-500">
            Netlify
          </div>
        </div>
      </div>
    </div>
  );
};

export default Skills;
