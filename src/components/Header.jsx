import image from "../../public/image.png";
const Header = () => {
  return (
    <div
      className="flex flex-col-reverse sm:flex-row items-start justify-between gap-3 md:gap-8"
      id="home"
    >
      <div className="flex flex-col gap-2">
        <h1 className="font-bold text-4xl sm:text-5xl md:text-6xl text-nowrap tracking-tighter">
          Hi, I'm{" "}
          <span className="bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
            Bogdan Robu
          </span>
        </h1>
        <p className="max-w-[500px] text-lg md:text-xl">
          Github: https://github.com/bogdiy97
        </p>
      </div>
      <img src={image} alt="" className="w-60 object-cover " />
    </div>
  );
};

export default Header;
