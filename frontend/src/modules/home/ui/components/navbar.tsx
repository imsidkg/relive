import React from 'react'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'
import { Button } from '@/components/ui/button'

type Props = {}

const navbar = (props: Props) => {
  return (
    <nav className="w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full px-8 sm:px-12 lg:px-16">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <a href="/" className="flex items-center">
              <img 
                src="/logo.svg" 
                alt="Logo" 
                className="h-7 w-auto"
              />
            </a>
          </div>

          <div className="flex items-center gap-4">
            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="outline" className="bg-white text-black hover:bg-gray-100">
                  Sign In
                </Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default navbar