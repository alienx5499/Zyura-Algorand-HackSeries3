import { Heart } from "lucide-react";

export function FooterBottom() {
  return (
    <div className="border-t border-gray-800/50 pt-8">
      <div className="flex flex-col md:flex-row justify-between items-center">
        <div className="flex flex-col md:flex-row items-center gap-4 mb-4 md:mb-0">
          <p className="text-sm text-neutral-400">
            © {new Date().getFullYear()} ZYURA. Made with{" "}
            <Heart className="inline h-3 w-3 text-pink-500 fill-current animate-pulse" />{" "}
            for travelers who deserve instant protection by{" "}
            <a
              href="https://github.com/alienx5499"
              target="_blank"
              rel="noopener noreferrer"
              title="Visit Prabal Patra's GitHub"
              className="text-cyan-400 hover:text-cyan-300 transition-colors underline underline-offset-2"
            >
              @alienx5499
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
