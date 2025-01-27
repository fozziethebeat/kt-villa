import Link from 'next/link';

import {auth} from '@/lib/auth';
import {DreamThemeGrid} from '@/components/DreamThemeGrid';
import {Header} from '@/components/Header';
import {Button} from '@/components/ui/button';
import {SidebarTrigger} from '@/components/ui/sidebar';

export default async function Home() {
  const session = await auth();
  return (
    <>
      <Header target="Home" links={[]} />
      <div className="flex flex-col gap-4 py-4 px-4">
        {session?.user ? (
          <div className="flex flex-col gap-2">
            <div className="bg-base-100 collapse">
              <input type="checkbox" className="peer" />
              <div className="collapse-title bg-primary text-primary-content peer-checked:bg-secondary peer-checked:text-secondary-content">
                What is Yumegai and why?
              </div>
              <div className="collapse-content bg-primary text-primary-content peer-checked:bg-secondary peer-checked:text-secondary-content">
                <p>
                  This is a collective project for Tianyi&apos;s 36th birthday
                  (May 19). You make dreams, based on personal stories
                  you&apos;ve had with Tianyi, and then I (Keith) will somehow
                  turn that into a cute booklet for her.
                </p>
                <br />
                <p>
                  Why dreams and what kind of dreams? Late 2024, Tianyi read the{' '}
                  <Link href="https://www.goodreads.com/book/show/194036469-dallergut-dream-department-store">
                    Dallergut Dream Department Store
                  </Link>{' '}
                  and <b>absolutely</b> loved it. So because of that, we&apos;re
                  going to turn our memories with Tianyi into inspiring,
                  challenging, and probably hilarious dreams. If you
                  haven&apos;t read Dallergut, go read it, it is pretty great
                  and a very fast read.
                </p>
                <br />
                <p>
                  To start, Click the &quot;Dream&quot; button and write a brief
                  personal memory. Try creating dream stories with AI. Once you
                  have a fun dream version of your memory, turn it into an image
                  (also with AI). Play around with different styles until you
                  are satisfied and then save. Keith will do the rest.
                </p>
              </div>
            </div>

            <DreamThemeGrid />
            <img
              className="rounded"
              src="/yumegai_banner_5.png"
              width="1024"
              height="512"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link href="/signin">Start Dreaming</Link>
            </Button>
            <img
              src="/yumegai_banner_5.png"
              width="1024"
              height="512"
              className="rounded"
            />
          </div>
        )}
      </div>
    </>
  );
}
