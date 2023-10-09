import { Link, routes } from '@redwoodjs/router'

const StableItemCard = ({ item }) => {
  return (
    <div className="card w-96 bg-base-100 shadow-xl">
      <Link to={routes.item({ id: item.id })}>
        <figure>
          <img src={item.image} />
        </figure>
        <div className="card-body">
          <div>
            <div className="badge badge-neutral">{item.claimStatus}</div>
            <div className="badge badge-primary">{item.ownerUsername}</div>
          </div>
          <h2 className="card-title">{item.id}</h2>
          <p>{item.text}</p>
        </div>
      </Link>
    </div>
  )
}

export default StableItemCard
