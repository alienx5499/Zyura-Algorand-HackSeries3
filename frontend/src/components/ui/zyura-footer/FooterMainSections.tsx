"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { FileText, Lock, Plane } from "lucide-react";
import { SiGithub, SiX } from "react-icons/si";
import { Button } from "@/components/ui/button";

export function FooterMainSections() {
  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, staggerChildren: 0.1 }}
    >
      <div className="lg:col-span-1">
        <div className="flex items-start mb-4">
          <Image
            src="/logo.svg"
            alt="ZYURA Logo"
            width={360}
            height={72}
            className="h-[72px] w-auto object-contain object-left"
            style={{
              display: "block",
              objectFit: "contain",
              objectPosition: "left center",
            }}
          />
        </div>
        <p className="text-sm text-neutral-300 mb-4 leading-relaxed">
          Instant, fair, community-owned flight delay insurance on Algorand. Get
          automated USDC payouts when delays occur.
        </p>
        <div className="flex gap-2">
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-neutral-400 hover:text-white hover:bg-purple-500/10 border border-transparent hover:border-purple-500/50 transition-all"
            >
              <Link
                href="https://github.com/alienx5499/Zyura-Algorand-HackSeries3"
                target="_blank"
                rel="noopener noreferrer"
              >
                <SiGithub className="h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-neutral-400 hover:text-white hover:bg-pink-500/10 border border-transparent hover:border-pink-500/50 transition-all"
            >
              <Link
                href="https://x.com/alienx5499"
                target="_blank"
                rel="noopener noreferrer"
              >
                <SiX className="h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>

      <FooterSection
        title="Product"
        titleClass="from-purple-400 to-pink-400"
        icon={<Plane className="h-4 w-4 text-purple-400" />}
      >
        <UnderlinedLink href="/#about" colorClass="purple">
          About ZYURA
        </UnderlinedLink>
        <UnderlinedLink href="/#features" colorClass="purple">
          Features
        </UnderlinedLink>
        <UnderlinedLink href="/#policies" colorClass="purple">
          Active Policies
        </UnderlinedLink>
        <UnderlinedLink href="/#contact" colorClass="purple">
          Contact Us
        </UnderlinedLink>
      </FooterSection>

      <FooterSection
        title="Resources"
        titleClass="from-pink-400 to-cyan-400"
        icon={<FileText className="h-4 w-4 text-pink-400" />}
      >
        <UnderlinedLink
          href="https://github.com/alienx5499/Zyura-Algorand-HackSeries3"
          colorClass="pink"
          external
        >
          Documentation
        </UnderlinedLink>
        <UnderlinedLink
          href="https://github.com/alienx5499/Zyura-Algorand-HackSeries3"
          colorClass="pink"
          external
        >
          GitHub Repository
        </UnderlinedLink>
        <UnderlinedLink
          href="https://github.com/alienx5499/Zyura-Algorand-HackSeries3/issues"
          colorClass="pink"
          external
        >
          Report Issue
        </UnderlinedLink>
        <UnderlinedLink href="#" colorClass="pink">
          FAQ
        </UnderlinedLink>
      </FooterSection>

      <FooterSection
        title="Legal"
        titleClass="from-cyan-400 to-purple-400"
        icon={<Lock className="h-4 w-4 text-cyan-400" />}
      >
        <UnderlinedLink href="#" colorClass="cyan">
          Privacy Policy
        </UnderlinedLink>
        <UnderlinedLink href="#" colorClass="cyan">
          Terms of Service
        </UnderlinedLink>
        <UnderlinedLink href="#" colorClass="cyan">
          Cookie Policy
        </UnderlinedLink>
        <UnderlinedLink
          href="https://github.com/alienx5499/Zyura-Algorand-HackSeries3/blob/main/LICENSE"
          colorClass="cyan"
          external
        >
          License
        </UnderlinedLink>
      </FooterSection>
    </motion.div>
  );
}

function FooterSection({
  title,
  titleClass,
  icon,
  children,
}: {
  title: string;
  titleClass: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <h4
        className={`font-semibold mb-4 bg-clip-text text-transparent bg-gradient-to-r ${titleClass} flex items-center gap-2`}
      >
        {icon}
        {title}
      </h4>
      <ul className="space-y-3 text-sm">{children}</ul>
    </div>
  );
}

function UnderlinedLink({
  href,
  colorClass,
  external = false,
  children,
}: {
  href: string;
  colorClass: "purple" | "pink" | "cyan";
  external?: boolean;
  children: ReactNode;
}) {
  const hoverClass =
    colorClass === "purple"
      ? "hover:text-purple-400"
      : colorClass === "pink"
        ? "hover:text-pink-400"
        : "hover:text-cyan-400";
  const bgClass =
    colorClass === "purple"
      ? "bg-purple-400"
      : colorClass === "pink"
        ? "bg-pink-400"
        : "bg-cyan-400";
  return (
    <li>
      <Link
        href={href}
        {...(external
          ? { target: "_blank", rel: "noopener noreferrer" }
          : { scroll: true })}
        className={`text-neutral-400 ${hoverClass} transition-colors duration-200 inline-block relative group`}
      >
        {children}
        <span
          className={`absolute left-0 bottom-0 w-0 h-px ${bgClass} transition-all duration-200 group-hover:w-full`}
        />
      </Link>
    </li>
  );
}
