import Link from "next/link";

export function BookingItemCard({ item }) {
  return (
    <div className="card w-96 bg-base-100 shadow-xl">
      <Link href={`/item/${item.id}`}>
        <figure>
          <img src={item.image} />
        </figure>
        <div className="card-body">
          <div>
            <div className="badge badge-neutral">{item.claimStatus}</div>
            <div className="badge badge-primary">{item.ownerUsername}</div>
          </div>
          <h2 className="card-title">{item.id}</h2>
          {item?.text && <p>{item.text.slice(0, 100)}</p>}
        </div>
      </Link>
    </div>
  );
}
