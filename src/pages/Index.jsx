import React from "react";
import { Fragment } from "react";
import { Popover, Transition } from "@headlessui/react";
import {
  ArrowPathIcon,
  Bars3Icon,
  BookmarkSquareIcon,
  CalendarIcon,
  ChartBarIcon,
  CursorArrowRaysIcon,
  LifebuoyIcon,
  PhoneIcon,
  PlayIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
  XMarkIcon,
  BoltIcon,
  ArchiveBoxIcon,
} from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { Link } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import HeroImage from "../assets/images/Banner.png";

const solutions = [
  {
    name: "Quick Search",
    description:
      "AI Powered Search is the solution for anyone who wants the power of AI to help them search faster and more efficiently.",
    href: "#",
    icon: BoltIcon,
  },
  {
    name: "Storage",
    description: "You can directly save all the questions you asked the AI.",
    href: "#",
    icon: ArchiveBoxIcon,
  },
  {
    name: "Security",
    description: "Your customers' data will be safe and secure.",
    href: "#",
    icon: ShieldCheckIcon,
  },
];
const callsToAction = [
  { name: "Watch Demo", href: "#", icon: PlayIcon },
  { name: "Contact Sales", href: "#", icon: PhoneIcon },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}
const Index = () => {
  const { user } = UserAuth();

  return (
    <Popover className="relative bg-slate-900 h-full">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-center justify-between border-b-2 border-gray-600 py-6 md:justify-start md:space-x-10">
          <div className="flex justify-start lg:w-0 lg:flex-1">
            <a href="#">
              <span className="sr-only">Your Company</span>
              <img
                className="h-8 w-auto sm:h-10"
                src="https://tailwindui.com/img/logos/mark.svg?color=blue&shade=600"
                alt=""
              />
            </a>
          </div>
          <div className="-my-2 -mr-2 md:hidden">
            <Popover.Button className="inline-flex items-center justify-center rounded-md bg-gray-900 p-2 text-gray-400 hover:bg-gray-800 dark:bg-gray-900 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500">
              <span className="sr-only">Open menu</span>
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </Popover.Button>
          </div>

          <div className="hidden items-center justify-end md:flex md:flex-1 lg:w-0">
            <Link
              to="/login"
              className="whitespace-nowrap text-base font-medium text-gray-500 hover:text-gray-400"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="ml-8 inline-flex items-center justify-center whitespace-nowrap rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
      <main className="mx-auto max-w-7xl px-4 mt-10 ">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-200 ">
              Everything you need
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              All in one place.
              <br className="hidden md:inline lg:hidden xl:inline" />
              <span className="text-blue-600">A clipboard</span> you can store
              images, text, files and links in.
            </p>
            <Link
              to={user ? "/dashboard" : "/register"}

              className="mt-8 inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
              Get started
            </Link>
          </div>

          <div className="mt-10">
            <img
              className="mx-auto rounded-lg shadow-xl shodow-white"
              src={HeroImage}
              alt="Big Image"
            />
          </div>
        </div>
      </main>

      <Transition
        as={Fragment}
        enter="duration-200 ease-out"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="duration-100 ease-in"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <Popover.Panel
          focus
          className="absolute  inset-x-0 top-0 origin-top-right transform p-2 transition md:hidden"
        >
          <div className="divide-y-2 divide-gray-50 dark:divide-gray-700 rounded-lg bg-gray-900 dark:bg-gray-900  shadow-lg ring-2 ring-black ring-opacity-5 dark:ring-white dark:ring-opacity-20 divide-opacity-50">
            <div className="px-5 pt-5 pb-6 ">
              <div className="flex items-center justify-between">
                <div>
                  <img
                    className="h-8 w-auto"
                    src="https://tailwindui.com/img/logos/mark.svg?color=blue&shade=600"
                    alt="Your Company"
                  />
                </div>
                <div className="-mr-2">
                  <Popover.Button className="inline-flex items-center justify-center rounded-md  bg-gray-900 p-2 text-gray-400 hover:bg-gray-100 dark:bg-gray-900 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ">
                    <span className="sr-only">Close menu</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </Popover.Button>
                </div>
              </div>
              <div className="mt-6 ">
                <nav className="grid gap-y-8 ">
                  {solutions.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      className="-m-3 flex items-center rounded-md p-3 text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <item.icon
                        className="h-6 w-6 flex-shrink-0 text-blue-600"
                        aria-hidden="true"
                      />
                      <span className="ml-3 text-base font-medium text-gray-200">
                        {item.name}
                      </span>
                    </a>
                  ))}
                </nav>
              </div>
            </div>
            <div className="space-y-6 py-6 px-5 ">
              <div>
                <Link
                  to="/register"
                  className="flex w-full items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700"
                >
                  Sign up
                </Link>
                <p className="mt-6 text-center text-base font-medium p-2 text-gray-500">
                  Existing customer?{" "}
                  <Link
                    to="/login"
                    className="text-blue-600 hover:text-blue-500"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </Popover.Panel>
      </Transition>
    </Popover>
  );
};

export default Index;
