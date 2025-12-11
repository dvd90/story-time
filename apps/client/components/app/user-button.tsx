'use client';

import { UserButton as ClerkUserButton, SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';

export function UserButton() {
  return (
    <>
      <SignedIn>
        <ClerkUserButton
          appearance={{
            elements: {
              avatarBox: 'w-8 h-8',
              userButtonPopoverCard: 'bg-slate-800 border border-slate-700',
              userButtonPopoverActionButton: 'text-slate-200 hover:bg-slate-700',
              userButtonPopoverActionButtonText: 'text-slate-200',
              userButtonPopoverFooter: 'hidden',
            },
          }}
        />
      </SignedIn>
      <SignedOut>
        <SignInButton mode="modal">
          <button className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-500">
            Sign In
          </button>
        </SignInButton>
      </SignedOut>
    </>
  );
}

