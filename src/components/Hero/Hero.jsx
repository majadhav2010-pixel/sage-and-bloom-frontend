import React, { useRef, useState, useEffect } from 'react';
import './Hero.css';

export const Hero = () => {
  const videoRef = useRef(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => setIsVideoLoaded(true);
    video.addEventListener('canplay', handleCanPlay);

    // Continuous smooth autoplay
    video.muted = true;
    video.play().catch(() => {});

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, []);

  return (
    <section className="hero hero-video-section" id="home">
      {/* Full-Width Clean Video Container without any icons or overlay controls */}
      <div className="hero-video-wrapper">
        <video
          ref={videoRef}
          className={`hero-bg-video ${isVideoLoaded ? 'is-loaded' : ''}`}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster="/images/slide_1.jpg"
          aria-label="Handmade botanical soap showcase video"
        >
          <source src="/soap%20file%20video_gwr_video_mvp.mp4" type="video/mp4" />
          <source src="/soap file video_gwr_video_mvp.mp4" type="video/mp4" />
          <source src="/soap-hero-video.mp4" type="video/mp4" />
          <source src="/soap%20file%20video.mp4" type="video/mp4" />
          <source src="/soap file video.mp4" type="video/mp4" />
          <source src="/hero-video.mp4" type="video/mp4" />
          <source src="/hero.mp4" type="video/mp4" />
          <source src="/soap-video.mp4" type="video/mp4" />
          <source src="/soap.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    </section>
  );
};
