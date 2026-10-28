import './NativeLaunchScreen.css';

const NativeLaunchScreen = () => (
    <div className="native-launch" role="status" aria-label="Starting DevelopWork">
        <div className="native-launch__glow native-launch__glow--one" />
        <div className="native-launch__glow native-launch__glow--two" />

        <div className="native-launch__content">
            <div className="native-launch__logo-shell">
                <span className="native-launch__orbit" aria-hidden="true" />
                <img
                    className="native-launch__logo"
                    src="/images/logo.png"
                    alt="DevelopWork"
                />
            </div>

            <div className="native-launch__wordmark">
                Develop<span>Work</span>
            </div>
            <p className="native-launch__tagline">Your work, beautifully organized.</p>

            <div className="native-launch__loader" aria-hidden="true">
                <span />
                <span />
                <span />
            </div>
        </div>
    </div>
);

export default NativeLaunchScreen;
