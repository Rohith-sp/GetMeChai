"use client";

/**
 * Animated Background Component
 * Creates floating blob animations inspired by ribbit.dk
 */
export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Gradient base */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1f] via-[#25252d] to-[#2d2d3a]" />
      
      {/* Animated Blobs */}
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />
      <div className="blob blob-4" />
      
      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-[#1a1a1f]/50" />
      
      <style jsx>{`
        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.15;
          animation: float-blob 20s infinite ease-in-out, pulse-glow 8s infinite ease-in-out;
        }
        
        .blob-1 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, #9b5de5 0%, transparent 70%);
          top: -10%;
          left: -10%;
          animation-delay: 0s;
        }
        
        .blob-2 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, #f15bb5 0%, transparent 70%);
          top: 50%;
          right: -5%;
          animation-delay: 5s;
        }
        
        .blob-3 {
          width: 450px;
          height: 450px;
          background: radial-gradient(circle, #00bbf9 0%, transparent 70%);
          bottom: -10%;
          left: 30%;
          animation-delay: 10s;
        }
        
        .blob-4 {
          width: 350px;
          height: 350px;
          background: radial-gradient(circle, #fee440 0%, transparent 70%);
          top: 20%;
          left: 50%;
          animation-delay: 15s;
        }
        
        @keyframes float-blob {
          0%, 100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1) rotate(120deg);
          }
          66% {
            transform: translate(-20px, 30px) scale(0.9) rotate(240deg);
          }
        }
        
        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.15;
          }
          50% {
            opacity: 0.25;
          }
        }
        
        @media (max-width: 768px) {
          .blob {
            filter: blur(60px);
          }
          .blob-1, .blob-2, .blob-3, .blob-4 {
            width: 300px;
            height: 300px;
          }
        }
      `}</style>
    </div>
  );
}
