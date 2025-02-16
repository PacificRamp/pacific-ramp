export default function Logo() {
  return (
    <a href={"/"} className="flex items-center justify-start shine gap-2">
      <img
        src="https://storage.googleapis.com/techave/PacificRampCoin.jpg"
        alt="Logo"
        className="object-cover size-10 rounded-full hidden md:block"
      />
      <span>Pacific Ramp</span>
    </a>
  );
}
