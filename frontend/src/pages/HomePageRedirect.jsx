import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import { v4 as uuidV4 } from 'uuid';

function HomePage() {
    const navigate = useNavigate();

    useEffect(() => {
        navigate(`/document/${uuidV4()}`);
    }, []);

    return (
        <></>
    );
}

export default HomePage;
