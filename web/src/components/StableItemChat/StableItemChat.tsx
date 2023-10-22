const StableItemChat = ({ stableItem }) => {
  if (stableItem.ownerUsername !== 'you') {
    return <></>
  }

  if (!stableItem.text) {
    return <></>
  }
  return (
    <div className="flex justify-between gap-2">
      <div>chatbox goes here</div>
    </div>
  )
}

export default StableItemChat
