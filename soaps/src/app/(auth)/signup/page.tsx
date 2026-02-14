import {SignupForm} from '@/components/SignupForm';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{magicCode?: string}>;
}) {
  const {magicCode} = await searchParams;
  return (
    <div className="flex h-screen w-full items-center justify-center px-4">
      <SignupForm magicCode={magicCode} />
    </div>
  );
}
