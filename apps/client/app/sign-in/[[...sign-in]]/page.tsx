import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
          <p className="mt-2 text-slate-300">Sign in to continue your story adventure</p>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'bg-slate-800/50 backdrop-blur-xl border border-slate-700 shadow-2xl',
              headerTitle: 'text-white',
              headerSubtitle: 'text-slate-300',
              socialButtonsBlockButton:
                'bg-slate-700 border-slate-600 text-white hover:bg-slate-600',
              socialButtonsBlockButtonText: 'text-white',
              dividerLine: 'bg-slate-600',
              dividerText: 'text-slate-400',
              formFieldLabel: 'text-slate-200',
              formFieldInput:
                'bg-slate-700 border-slate-600 text-white placeholder:text-slate-400',
              formButtonPrimary:
                'bg-purple-600 hover:bg-purple-500 text-white',
              footerActionLink: 'text-purple-400 hover:text-purple-300',
              identityPreviewText: 'text-slate-200',
              identityPreviewEditButton: 'text-purple-400',
            },
          }}
        />
      </div>
    </div>
  );
}

