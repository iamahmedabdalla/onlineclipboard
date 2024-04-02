import React from 'react'
import { Fragment } from 'react'
import { Popover, Transition } from '@headlessui/react'
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
} from '@heroicons/react/24/outline'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { Link } from 'react-router-dom'
import { UserAuth } from "../context/AuthContext";



const solutions = [
  {
    name: 'Quick Search',
    description: 'AI Powered Search is the solution for anyone who wants the power of AI to help them search faster and more efficiently.',
    href: '#',
    icon: BoltIcon,
  },
  {
    name: 'Storage',
    description: 'You can directly save all the questions you asked the AI.',
    href: '#',
    icon: ArchiveBoxIcon,
  },
  { name: 'Security', description: "Your customers' data will be safe and secure.", href: '#', icon: ShieldCheckIcon },
]
const callsToAction = [
  { name: 'Watch Demo', href: '#', icon: PlayIcon },
  { name: 'Contact Sales', href: '#', icon: PhoneIcon },
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}
const Index = () => {
    const { user } = UserAuth();

  return (
    <Popover className="relative bg-white dark:bg-inherit h-screen ">
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="flex items-center justify-between border-b-2 border-gray-100 dark:border-gray-600 py-6 md:justify-start md:space-x-10">
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
          <Popover.Button className="inline-flex items-center justify-center rounded-md bg-white p-2 text-gray-400 hover:bg-gray-800 dark:bg-gray-900 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500">
            <span className="sr-only">Open menu</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </Popover.Button>
        </div>
        
        <div className="hidden items-center justify-end md:flex md:flex-1 lg:w-0">
          <Link to='/login' className="whitespace-nowrap text-base font-medium text-gray-200 hover:text-gray-400">
            Sign in
          </Link>
          <Link
            to='/register'
            className="ml-8 inline-flex items-center justify-center whitespace-nowrap rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
    <main className="mx-auto mt-10 max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28 ">
            <div className="sm:text-center lg:text-left">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
                <span className="block xl:inline dark:text-white">
                    The Best{' '}
                    </span>{' '}
                <span className="block text-blue-600 xl:inline">Clipboard in the world</span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mx-auto sm:mt-5 sm:max-w-xl sm:text-lg md:mt-5 md:text-xl lg:mx-0">
                This clipboard can hold text, images, and files. It can be accessed from anywhere and shared with anyone.
              </p>
              <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                <div className="rounded-md shadow">
                  <Link
                    to= {user ? '/dashboard' : '/login'}
                    className="flex w-full items-center justify-center rounded-md border border-transparent bg-blue-600 px-8 py-3 text-base font-medium text-white hover:bg-blue-700 md:py-4 md:px-10 md:text-lg"
                  >
                    Get started
                  </Link>
                </div>
                
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
      <Popover.Panel focus className="absolute inset-x-0 top-0 origin-top-right transform p-2 transition md:hidden">
        <div className="divide-y-2 divide-gray-50 dark:divide-gray-700 rounded-lg bg-white dark:bg-gray-900  shadow-lg ring-2 ring-black ring-opacity-5 dark:ring-white dark:ring-opacity-20 divide-opacity-50">
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
                <Popover.Button className="inline-flex items-center justify-center rounded-md  bg-white p-2 text-gray-400 hover:bg-gray-100 dark:bg-gray-900 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ">
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
                    className="-m-3 flex items-center rounded-md p-3 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <item.icon className="h-6 w-6 flex-shrink-0 text-blue-600" aria-hidden="true" />
                    <span className="ml-3 text-base font-medium text-gray-900 dark:text-white">{item.name}</span>
                  </a>
                ))}
              </nav>
            </div>
          </div>
          <div className="space-y-6 py-6 px-5 ">
            
            <div>
              <Link
                to='/register'
                className="flex w-full items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700"
              >
                Sign up
              </Link>
              <p className="mt-6 text-center text-base font-medium p-2 text-gray-500">
                Existing customer?{' '}
                <Link to='/login' className="text-blue-600 hover:text-blue-500">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
        
      </Popover.Panel>
    </Transition>
  </Popover>
  
  )
}

export default Index