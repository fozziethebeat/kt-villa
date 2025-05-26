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
            {isUserDream
              ? 'Your Dream for Tianyi'
              : `${dream.user.name}'s Dream`}{' '}
          </h2>
          <p>{dream.story}</p>
          <div className="card-actions justify-around">
            <Link
              href={`/project/${dream.project.owner.id}/${dream.project.code}`}>
              <button className="btn btn-primary">Project</button>
            </Link>
            {isUserDream && (
              <Link
                href={`/dream/edit?id=${dream.id}&owner=${dream.project.owner.id}&project=${dream.project.code}`}>
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
        <h2 className="card-title">Let&apos;s get dreaming</h2>
        <p>Your memory with Tianyi TBD</p>
        <div className="card-actions justify-end">
          <Link
            href={`/dream/new?owner=${dream.project.owner.id}&project=${dream.project.code}`}>
            <button className="btn btn-primary">Dream</button>
          </Link>
        </div>
      </div>
    </div>
  );
}
