import {SignupForm} from '@/components/SignupForm';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{magicCode?: string}>;
}) {
  const {magicCode} = await searchParams;
  return (
    <div className="flex min-h-screen w-full items-center justify-center px-4 bg-gradient-to-br from-brand-wine-light via-brand-cream to-brand-plum-light">
      <SignupForm magicCode={magicCode} />
    </div>
  );
}
