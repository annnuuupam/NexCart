import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { SearchX, ArrowLeft, Home } from "lucide-react";
import { ThemeToggle } from "../components/layout/ThemeToggle";
import logo from "../assets/images/logo.png";
import "../styles/LoginPage.css";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.22, 0.61, 0.36, 1] },
  }),
};

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="login-page">
      <nav className="login-navbar">
        <div className="login-brand" onClick={() => navigate("/")}>
          <img src={logo} alt="NexCart" />
          <span>NexCart</span>
        </div>
        <div className="login-navbar-actions">
          <ThemeToggle />
        </div>
      </nav>

      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center p-6">
        <motion.div
          className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/40 bg-white/70 p-10 text-center shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/70"
          initial="hidden"
          animate="visible"
        >
          <motion.div
            className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-blue-50 text-blue-600 shadow-inner dark:bg-blue-500/10 dark:text-blue-400"
            custom={0}
            variants={fadeUp}
          >
            <SearchX size={48} strokeWidth={1.5} />
          </motion.div>

          <motion.h1
            className="mb-2 text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white"
            custom={1}
            variants={fadeUp}
          >
            404
          </motion.h1>

          <motion.h2
            className="mb-4 text-2xl font-semibold text-slate-800 dark:text-slate-100"
            custom={2}
            variants={fadeUp}
          >
            Page not found
          </motion.h2>

          <motion.p
            className="mb-10 text-sm leading-relaxed text-slate-500 dark:text-slate-400"
            custom={3}
            variants={fadeUp}
          >
            The page you're looking for doesn't exist or has been moved. Check the URL or navigate back to safety.
          </motion.p>

          <motion.div
            className="flex flex-col gap-3 sm:flex-row sm:justify-center"
            custom={4}
            variants={fadeUp}
          >
            <button
              onClick={() => navigate(-1)}
              className="group flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow disabled:opacity-70 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:w-auto sm:scroll-px-8 sm:px-6"
            >
              <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
              Go Back
            </button>
            <Link
              to="/"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-700 hover:shadow-blue-500/40 disabled:opacity-70 sm:w-auto sm:px-6"
            >
              <Home size={16} />
              Home
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
