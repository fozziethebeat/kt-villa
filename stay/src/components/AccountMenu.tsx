import {auth, signOut} from '@/lib/auth';
import Link from 'next/link';
import {redirect} from 'next/navigation';

export async function AccountMenu() {
  const session = await auth();
  return (
    <div className="dropdown dropdown-end">
      <label tabIndex={0} className="avatar btn btn-circle btn-ghost">
        <div className="w-10 rounded-full">
          <img src={session.user?.profileImageUrl} />
        </div>
      </label>

      <ul
        tabIndex={0}
        className="menu dropdown-content rounded-box menu-sm z-[1] mt-3 w-52 bg-base-100 p-2 shadow">
        <li>
          <Link href="/">Home</Link>
        </li>
        <li>
          <Link href="/me">My Page</Link>
        </li>
        <li>
          <Link href="/about">About</Link>
        </li>
        {session?.user?.roles == 'admin' && (
          <>
            <div className="divider" />
            <li>
              <Link href="/admin">Review</Link>
            </li>
          </>
        )}
        <div className="divider" />
        <li>
          <form
            action={async () => {
              'use server';

              await signOut();
            }}>
            <button type="submit" className="w-full text-left">
              Signout
            </button>
          </form>
        </li>
      </ul>
    </div>
  );
}
