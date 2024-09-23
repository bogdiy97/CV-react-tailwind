import React from "react";
import project1 from "../../public/project-1.png";
import project2 from "../../public/project-2.png";
import project3 from "../../public/project-3.png";
import project4 from "../../public/project-4.png";
import project5 from "../../public/project-5.png";
import project6 from "../../public/project-6.png";
const Projects = () => {
  return (
    <div className="space-y-5 pt-10" id="projects">
      <h1 className="font-bold text-4xl sm:text-5xl md:text-6xl text-center">
        <span className="bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
          Projects I played with in my free time
        </span>
      </h1>

      <h3 className="font-semibold text-gray-500 text-xl text-center">
        You can click to have a look
      </h3>
      <div className="flex flex-col items-center justify-center space-y-5">
        <div className="sm:flex gap-5 space-y-5 sm:space-y-0">
          {/* Project 1 */}
          <a
            href="https://agenda-virtuala.netlify.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-baseline text-left gap-2 max-w-[300px] border rounded-lg p-5 hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
          >
            <img
              src={project1}
              alt="Project 1"
              className="w-[300px] rounded-md"
            />
            <h3 className="text-lg font-bold">Virtual Agenda</h3>
            <span className="text-sm text-gray-500 font-semibold">
              Jan 2024 - Feb 2024
            </span>
            <p className="text-sm text-gray-400 font-medium max-w-64">
              Project description here.
            </p>
            <div className="flex gap-3 text-xs">
              <div className="py-2 px-5 border-none text-white font-semibold rounded-xl hover:opacity-75 bg-gradient-to-r from-black to-red-500">
                HTML
              </div>
              <div className="py-2 px-5 border-none text-white font-semibold rounded-xl hover:opacity-75 bg-gradient-to-r from-emerald-500 to-green-500">
                CSS
              </div>
              <div className="py-2 px-5 border-none text-white font-semibold rounded-xl hover:opacity-75 bg-gradient-to-r from-blue-500 to-sky-500">
                JavaScript
              </div>
            </div>
          </a>

          {/* Project 2 */}
          <a
            href="https://pixi-falling-shapes.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-baseline text-left gap-2 max-w-[300px] border rounded-lg p-5 hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
          >
            <img
              src={project2}
              alt="Project 2"
              className="w-[300px] rounded-md"
            />
            <h3 className="text-lg font-bold">Pixi Falling Shapes</h3>
            <span className="text-sm text-gray-500 font-semibold">
              Jan 2024 - Feb 2024
            </span>
            <p className="text-sm text-gray-400 font-medium max-w-64">
              Project description here.
            </p>
            <div className="flex gap-3 text-xs">
              <div className="py-2 px-5 border-none text-white font-semibold rounded-xl hover:opacity-75 bg-gradient-to-r from-black to-red-500">
                HTML
              </div>
              <div className="py-2 px-5 border-none text-white font-semibold rounded-xl hover:opacity-75 bg-gradient-to-r from-emerald-500 to-green-500">
                CSS
              </div>
              <div className="py-2 px-5 border-none text-white font-semibold rounded-xl hover:opacity-75 bg-gradient-to-r from-blue-500 to-sky-500">
                JavaScript
              </div>
            </div>
          </a>

          {/* Project 3 */}
          <a
            href="https://accordion-wrapper.netlify.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-baseline text-left gap-2 max-w-[300px] border rounded-lg p-5 hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
          >
            <img
              src={project3}
              alt="Project 3"
              className="w-[300px] rounded-md"
            />
            <h3 className="text-lg font-bold">Accordion Wrapper</h3>
            <span className="text-sm text-gray-500 font-semibold">
              Jan 2024 - Feb 2024
            </span>
            <p className="text-sm text-gray-400 font-medium max-w-64">
              Project description here.
            </p>
            <div className="flex gap-3 text-xs">
              <div className="py-2 px-5 border-none text-white font-semibold rounded-xl hover:opacity-75 bg-gradient-to-r from-black to-red-500">
                HTML
              </div>
              <div className="py-2 px-5 border-none text-white font-semibold rounded-xl hover:opacity-75 bg-gradient-to-r from-emerald-500 to-green-500">
                CSS
              </div>
              <div className="py-2 px-5 border-none text-white font-semibold rounded-xl hover:opacity-75 bg-gradient-to-r from-blue-500 to-sky-500">
                JavaScript
              </div>
            </div>
          </a>

          {/* Project 4 */}
          <a
            href="https://traffic-light-react-exercise.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-baseline text-left gap-2 max-w-[300px] border rounded-lg p-5 hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
          >
            <img
              src={project4}
              alt="Project 4"
              className="w-[300px] rounded-md"
            />
            <h3 className="text-lg font-bold">Traffic Light Exercise</h3>
            <span className="text-sm text-gray-500 font-semibold">
              Jan 2024 - Feb 2024
            </span>
            <p className="text-sm text-gray-400 font-medium max-w-64">
              Project description here.
            </p>
            <div className="flex gap-3 text-xs">
              <div className="py-2 px-5 border-none text-white font-semibold rounded-xl hover:opacity-75 bg-gradient-to-r from-black to-red-500">
                HTML
              </div>
              <div className="py-2 px-5 border-none text-white font-semibold rounded-xl hover:opacity-75 bg-gradient-to-r from-emerald-500 to-green-500">
                CSS
              </div>
              <div className="py-2 px-5 border-none text-white font-semibold rounded-xl hover:opacity-75 bg-gradient-to-r from-blue-500 to-sky-500">
                JavaScript
              </div>
            </div>
          </a>
          {/* Project 5 */}
          <a
            href="https://product-carousel.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-baseline text-left gap-2 max-w-[300px] border rounded-lg p-5 hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
          >
            <img
              src={project6}
              alt="Project 4"
              className="w-[300px] rounded-md"
            />
            <h3 className="text-lg font-bold">Product Carousel</h3>
            <span className="text-sm text-gray-500 font-semibold">
              Jan 2024 - Feb 2024
            </span>
            <p className="text-sm text-gray-400 font-medium max-w-64">
              Project description here.
            </p>
            <div className="flex gap-3 text-xs">
              <div className="py-2 px-5 border-none text-white font-semibold rounded-xl hover:opacity-75 bg-gradient-to-r from-black to-red-500">
                HTML
              </div>
              <div className="py-2 px-5 border-none text-white font-semibold rounded-xl hover:opacity-75 bg-gradient-to-r from-emerald-500 to-green-500">
                CSS
              </div>
              <div className="py-2 px-5 border-none text-white font-semibold rounded-xl hover:opacity-75 bg-gradient-to-r from-blue-500 to-sky-500">
                JavaScript
              </div>
            </div>
          </a>
          {/* Project 5 */}
          <a
            href="https://crud-table-bogdan.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-baseline text-left gap-2 max-w-[300px] border rounded-lg p-5 hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
          >
            <img
              src={project5}
              alt="Project 4"
              className="w-[300px] rounded-md"
            />
            <h3 className="text-lg font-bold">CRUD Table</h3>
            <span className="text-sm text-gray-500 font-semibold">
              Jan 2024 - Feb 2024
            </span>
            <p className="text-sm text-gray-400 font-medium max-w-64">
              Project description here.
            </p>
            <div className="flex gap-3 text-xs">
              <div className="py-2 px-5 border-none text-white font-semibold rounded-xl hover:opacity-75 bg-gradient-to-r from-black to-red-500">
                HTML
              </div>
              <div className="py-2 px-5 border-none text-white font-semibold rounded-xl hover:opacity-75 bg-gradient-to-r from-emerald-500 to-green-500">
                CSS
              </div>
              <div className="py-2 px-5 border-none text-white font-semibold rounded-xl hover:opacity-75 bg-gradient-to-r from-blue-500 to-sky-500">
                JavaScript
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Projects;
