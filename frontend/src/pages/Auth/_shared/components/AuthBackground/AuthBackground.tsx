export function AuthBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <svg width="0" height="0" className="absolute">
        <defs>
          <filter id="lg-refract-subtle" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.02 0.025"
              numOctaves="2"
              seed="12"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="10"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      <div className="absolute inset-0" style={{ background: '#f5f5f7' }} />

      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 100% 65% at 50% -5%, rgba(180, 200, 240, 0.2) 0%, transparent 70%)',
        }}
      />

      <div
        className="absolute auth-orb-float-1"
        style={{
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          top: '-150px',
          left: '-160px',
          background: 'radial-gradient(circle, rgba(190, 195, 235, 0.18) 0%, transparent 65%)',
          filter: 'blur(60px)',
        }}
      />

      <div
        className="absolute auth-orb-float-2"
        style={{
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          top: '5%',
          right: '-130px',
          background: 'radial-gradient(circle, rgba(170, 210, 240, 0.14) 0%, transparent 65%)',
          filter: 'blur(70px)',
        }}
      />

      <div
        className="absolute auth-orb-float-3"
        style={{
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          bottom: '-80px',
          left: '25%',
          background: 'radial-gradient(circle, rgba(200, 215, 235, 0.12) 0%, transparent 65%)',
          filter: 'blur(80px)',
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          opacity: 0.02,
          mixBlendMode: 'multiply',
        }}
      />

      <style>{`
        @keyframes orbFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(20px, -18px) scale(1.03); }
          66% { transform: translate(-12px, 14px) scale(0.98); }
        }
        @keyframes orbFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          40% { transform: translate(-18px, 22px) scale(1.04); }
          70% { transform: translate(14px, -10px) scale(0.97); }
        }
        @keyframes orbFloat3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          30% { transform: translate(14px, -14px) scale(1.02); }
          65% { transform: translate(-8px, 10px) scale(0.99); }
        }
        .auth-orb-float-1 { animation: orbFloat1 20s ease-in-out infinite; }
        .auth-orb-float-2 { animation: orbFloat2 24s ease-in-out infinite; }
        .auth-orb-float-3 { animation: orbFloat3 18s ease-in-out infinite; }
      `}</style>
    </div>
  )
}
