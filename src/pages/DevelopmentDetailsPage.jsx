import githubLogo from '../assets/github-mark.svg';
import reactLogo from '../assets/react.svg';
import viteLogo from '../assets/Vite-Logo.svg';
import figmaLogo from '../assets/Figma-Icon.svg';

function DevelopmentDetailsPage() {
    return(
        <div id="dev-details-page-container">
            <h1 className="page-h1">Development</h1>
            <div className="demo-details-container">
                <a href="https://github.com/jfab3/velocitype" target="_blank">
                    <img className="logo" alt="GitHub Logo" src={githubLogo}></img>
                    <div>GitHub</div>
                </a>
                <a href="https://react.dev" target="_blank">
                    <img className="logo" alt="React Logo" src={reactLogo}></img>
                    <div>React</div>
                </a>
                <a href="https://www.figma.com/design/iqTqYTTBSXprGaYY60lyJr/Velocitype?node-id=0%3A1&t=DXhAsLTwXvjniaS9-1" target="_blank">
                    <img className="logo" alt="Figma Logo" src={figmaLogo}></img>
                    <div>Figma</div>
                </a>
                <a href="https://vitejs.dev" target="_blank">
                    <img className="logo" alt="Vite Logo" src={viteLogo}></img>
                    <div>Vite</div>
                </a>
            </div>
        </div>
    )
}

export default DevelopmentDetailsPage;
