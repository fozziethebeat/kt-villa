import { Link, routes } from '@redwoodjs/router'

const StableItemCard = ({ item }) => {
  return (
    <div className="card w-96 bg-base-100 shadow-xl">
      <Link to={routes.item({ id: item.id })}>
        <figure>
          <img src={item.image} />
        </figure>
        <div className="card-body">
          <p>{item.text}</p>
          <h2 className="card-title">{item.id}</h2>
        </div>
      </Link>
    </div>
  )
}

export default StableItemCard
