import { useState, useRef, useEffect } from 'react'
import IconButton from '../components/IconButton';
import { GiHamburgerMenu } from "react-icons/gi";

import { Link } from "react-router-dom";

const DropdownMenu = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef();

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    }

    useEffect(() => {
        function closeDropdown(evt) {
            if (!dropdownRef.current.contains(evt.target)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            window.addEventListener("click", closeDropdown);
        }

        return function removeClickListener() {
            window.removeEventListener("click", closeDropdown);
        }
    }, [isOpen]);

    return (
        <div className="dropdown" ref={dropdownRef} >
            <IconButton onClick={toggleDropdown} Icon={GiHamburgerMenu} />
            {isOpen && (
                <ul>
                    {children.map(child => <li key={child.props.id} onClick={toggleDropdown}>{child}</li>)}
                </ul>
            )}
        </div>
    )
}

export default DropdownMenu;