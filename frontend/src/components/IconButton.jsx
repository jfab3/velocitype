function IconButton ({ onClick, Icon}) {
    return (
        <button className="icon-button" onClick={onClick}>
            <Icon />
        </button>
    ) 
}

export default IconButton;