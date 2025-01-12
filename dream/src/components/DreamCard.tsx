import Link from 'next/link';

export function DreamCard({dream, isUserDream}) {
  if (dream?.dreamImage) {
    return (
      <div className="card bg-base-100 w-96 h-128 shadow-xl">
        <figure className="h-96 w-96">
          <img src={dream.dreamImage} />
        </figure>
        <div className="card-body">
          <h2 className="card-title">
            {isUserDream ? 'Your Dream for Tianyi' : 'Another Dream'}{' '}
          </h2>
          <p>{dream.story}</p>
          <div className="card-actions justify-end">
            {isUserDream && (
              <Link href="/dream">
                <button className="btn btn-primary">Update</button>
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="card bg-base-100 w-96 h-128 shadow-xl">
      <div className="placeholder bg-neutral-content h-96 w-96"></div>
      <div className="card-body">
        <h2 className="card-title">Let's get dreaming</h2>
        <p>Your memory with Tianyi TBD</p>
        <div className="card-actions justify-end">
          <Link href="/dream">
            <button className="btn btn-primary">Dream</button>
          </Link>
        </div>
      </div>
    </div>
  );
}
