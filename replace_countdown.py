import re

with open('app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace the countdown overlay section
old_pattern = r'{/\* Countdown Overlay \*/}.*?</AnimatePresence>'
new_code = '''{/* Countdown Overlay - Ultra Premium */}
                      <AnimatePresence>
                        {countdown !== null && (
                          <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 1.5, opacity: 0 }}
                            transition={{ 
                              duration: 0.4,
                              ease: [0.34, 1.56, 0.64, 1]
                            }}
                            className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
                          >
                            {/* Outer Glow Ring */}
                            <motion.div
                              animate={{ 
                                scale: [1, 1.2, 1],
                                opacity: [0.3, 0.6, 0.3]
                              }}
                              transition={{ 
                                duration: 1,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                              className="absolute w-48 h-48 sm:w-64 sm:h-64 rounded-full"
                              style={{
                                background: 'radial-gradient(circle, rgba(0,255,163,0.4) 0%, transparent 70%)',
                                filter: 'blur(20px)'
                              }}
                            />
                            
                            {/* Main Circle Container */}
                            <div className="relative w-32 h-32 sm:w-40 sm:h-40">
                              {/* Animated Circle Progress */}
                              <svg className="absolute inset-0 w-full h-full -rotate-90">
                                <circle
                                  cx="50%"
                                  cy="50%"
                                  r="45%"
                                  fill="none"
                                  stroke="rgba(255,255,255,0.1)"
                                  strokeWidth="3"
                                />
                                <motion.circle
                                  cx="50%"
                                  cy="50%"
                                  r="45%"
                                  fill="none"
                                  stroke="url(#countdown-gradient)"
                                  strokeWidth="4"
                                  strokeLinecap="round"
                                  initial={{ pathLength: 1 }}
                                  animate={{ pathLength: countdown / 5 }}
                                  transition={{ duration: 0.3, ease: "easeOut" }}
                                  style={{
                                    filter: 'drop-shadow(0 0 8px rgba(0,255,163,0.8))'
                                  }}
                                />
                                <defs>
                                  <linearGradient id="countdown-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#00FFA3" />
                                    <stop offset="50%" stopColor="#03E1FF" />
                                    <stop offset="100%" stopColor="#DC1FFF" />
                                  </linearGradient>
                                </defs>
                              </svg>
                              
                              {/* Glass Background */}
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-black/60 backdrop-blur-xl border border-white/20 shadow-[0_0_40px_rgba(0,255,163,0.3)]" />
                              </div>
                              
                              {/* Number with Pulse */}
                              <motion.div
                                key={countdown}
                                initial={{ scale: 1.3, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ 
                                  duration: 0.3,
                                  ease: [0.34, 1.56, 0.64, 1]
                                }}
                                className="absolute inset-0 flex items-center justify-center"
                              >
                                <span 
                                  className="font-black text-transparent bg-clip-text bg-gradient-to-br from-[#00FFA3] via-[#03E1FF] to-[#DC1FFF] text-6xl sm:text-7xl"
                                  style={{
                                    textShadow: '0 0 40px rgba(0,255,163,0.8), 0 0 80px rgba(3,225,255,0.4)',
                                    filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.8))'
                                  }}
                                >
                                  {countdown}
                                </span>
                              </motion.div>
                              
                              {/* Rotating Particles */}
                              {[...Array(3)].map((_, i) => (
                                <motion.div
                                  key={i}
                                  animate={{ rotate: 360 }}
                                  transition={{
                                    duration: 3 + i,
                                    repeat: Infinity,
                                    ease: "linear"
                                  }}
                                  className="absolute inset-0"
                                >
                                  <div 
                                    className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-[#00FFA3] to-[#03E1FF]"
                                    style={{
                                      top: '10%',
                                      left: '50%',
                                      boxShadow: '0 0 12px rgba(0,255,163,0.8)',
                                      transform: `translateX(-50%) rotate(${i * 120}deg) translateY(-60px)`
                                    }}
                                  />
                                </motion.div>
                              ))}
                            </div>
                            
                            {/* Bottom Text */}
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.2 }}
                              className="absolute bottom-8 sm:bottom-12"
                            >
                              <p className="text-xs sm:text-sm font-bold text-zinc-400 uppercase tracking-widest">
                                Round Starting...
                              </p>
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>'''

content = re.sub(old_pattern, new_code, content, flags=re.DOTALL)

with open('app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Replacement done!")
