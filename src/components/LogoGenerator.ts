/**
 * Dynamically draws an elegant, high-DPI Karate Dojo emblem crest
 * and returns it as a real, crisp base64 PNG.
 * Perfect for both the web interface and embedding in jsPDF!
 */
export function getClubLogoBase64(): string {
  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 600;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const cx = 300;
  const cy = 290;

  // Clear background
  ctx.clearRect(0, 0, 600, 600);

  // 1. Draw Crossed Samurai Katanas behind the shield body
  ctx.save();
  ctx.lineWidth = 14;
  ctx.lineCap = "round";

  // Left-bottom to Right-top Katana
  ctx.strokeStyle = "rgba(180, 185, 195, 0.95)"; // Slate steel shiny blade
  ctx.beginPath();
  ctx.moveTo(cx - 260, cy + 200);
  ctx.lineTo(cx + 260, cy - 200);
  ctx.stroke();

  // Highlight line on blade
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx - 250, cy + 190);
  ctx.lineTo(cx + 260, cy - 200);
  ctx.stroke();

  // Right-bottom to Left-top Katana
  ctx.lineWidth = 14;
  ctx.strokeStyle = "rgba(180, 185, 195, 0.95)";
  ctx.beginPath();
  ctx.moveTo(cx + 260, cy + 200);
  ctx.lineTo(cx - 260, cy - 200);
  ctx.stroke();

  // Highlight
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx + 250, cy + 190);
  ctx.lineTo(cx - 260, cy - 200);
  ctx.stroke();

  // Draw Gold Guards (Tsubas)
  ctx.fillStyle = "#fbbf24"; // Warm gold
  ctx.lineWidth = 5;
  ctx.strokeStyle = "#451a03"; // Dark outline
  
  // Guard 1
  ctx.beginPath();
  ctx.arc(cx - 160, cy + 120, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Guard 2
  ctx.beginPath();
  ctx.arc(cx + 160, cy + 120, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Draw vibrant orange katana wraps (Hilts/Tsuka)
  ctx.strokeStyle = "#ea580c"; // High-contrast orange-red bindings
  ctx.lineWidth = 15;
  
  // Hilt 1
  ctx.beginPath();
  ctx.moveTo(cx - 160, cy + 120);
  ctx.lineTo(cx - 225, cy + 175);
  ctx.stroke();

  // Hilt 2
  ctx.beginPath();
  ctx.moveTo(cx + 160, cy + 120);
  ctx.lineTo(cx + 225, cy + 175);
  ctx.stroke();

  // Draw golden pommels
  ctx.fillStyle = "#fbbf24";
  ctx.beginPath();
  ctx.arc(cx - 225, cy + 175, 10, 0, Math.PI * 2);
  ctx.arc(cx + 225, cy + 175, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();

  // 2. Beautiful Shield Path
  const makeShieldPath = (c_ctx: CanvasRenderingContext2D, inset: number) => {
    const rx = 215 - inset;
    const ry1 = 200 - inset;
    const ry2 = 130; // bottom curved bend
    
    c_ctx.beginPath();
    // Top center dip
    c_ctx.moveTo(cx, cy - ry1 + 35);
    // Top right curve of shield
    c_ctx.quadraticCurveTo(cx + rx * 0.5, cy - ry1 - 15, cx + rx, cy - ry1 + 35);
    // Right side top down
    c_ctx.lineTo(cx + rx, cy + 30);
    // Curved down to bottom point
    c_ctx.quadraticCurveTo(cx + rx, cy + ry2, cx, cy + ry2 + 130 - inset);
    // Left side curve to bottom point
    c_ctx.quadraticCurveTo(cx - rx, cy + ry2, cx - rx, cy + 30);
    // Left side top down
    c_ctx.lineTo(cx - rx, cy - ry1 + 35);
    // Top left curve of shield
    c_ctx.quadraticCurveTo(cx - rx * 0.5, cy - ry1 - 15, cx, cy - ry1 + 35);
    c_ctx.closePath();
  };

  // Draw shadow
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 15;
  ctx.shadowOffsetY = 8;
  
  // Outer bright Gold Border
  ctx.fillStyle = "#fbbf24"; // Radiant gold
  makeShieldPath(ctx, 0);
  ctx.fill();
  ctx.restore();

  // Inner Dark Slate outline
  ctx.strokeStyle = "#0f172a"; // Deep carbon
  ctx.lineWidth = 14;
  makeShieldPath(ctx, 4);
  ctx.stroke();

  // Inner gold line highlight
  ctx.strokeStyle = "#fef08a"; // Lemon yellow glow
  ctx.lineWidth = 3;
  makeShieldPath(ctx, 10);
  ctx.stroke();

  // Shield deep crimson background
  ctx.fillStyle = "#991b1b"; // Royal crimson red interior
  makeShieldPath(ctx, 12);
  ctx.fill();

  // 3. Draw dual stylized White Tiger Face Badges on left/right sides
  // Left Badge
  ctx.save();
  ctx.fillStyle = "rgba(15, 23, 42, 0.4)";
  ctx.beginPath();
  ctx.arc(cx - 130, cy - 30, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#fbbf24";
  ctx.lineWidth = 2.5;
  ctx.stroke();
  
  // Stylized white tiger details
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 9px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("館", cx - 130, cy - 18);
  // Tiger ears & simple face lines
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 142, cy - 40);
  ctx.lineTo(cx - 135, cy - 35);
  ctx.lineTo(cx - 130, cy - 40);
  ctx.lineTo(cx - 125, cy - 35);
  ctx.lineTo(cx - 118, cy - 40);
  ctx.stroke();
  // Eyes
  ctx.fillStyle = "#fbbf24";
  ctx.beginPath();
  ctx.arc(cx - 138, cy - 32, 2.5, 0, Math.PI * 2);
  ctx.arc(cx - 122, cy - 32, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Right Badge
  ctx.save();
  ctx.fillStyle = "rgba(15, 23, 42, 0.4)";
  ctx.beginPath();
  ctx.arc(cx + 130, cy - 30, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#fbbf24";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 9px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("館", cx + 130, cy - 18);
  // Tiger ears & simple face lines
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx + 118, cy - 40);
  ctx.lineTo(cx + 125, cy - 35);
  ctx.lineTo(cx + 130, cy - 40);
  ctx.lineTo(cx + 135, cy - 35);
  ctx.lineTo(cx + 142, cy - 40);
  ctx.stroke();
  // Eyes
  ctx.fillStyle = "#fbbf24";
  ctx.beginPath();
  ctx.arc(cx + 122, cy - 32, 2.5, 0, Math.PI * 2);
  ctx.arc(cx + 138, cy - 32, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 4. Draw the Roaring Golden Lion (Centerpiece)
  ctx.save();
  
  // Spiky Golden Lion Mane
  const maneRadius = 100;
  ctx.fillStyle = "#c2410c"; // Deep rust/orange shadow mane
  ctx.beginPath();
  for (let i = 0; i < 32; i++) {
    const angle = (i * Math.PI * 2) / 32;
    const isSpike = i % 2 === 0;
    const r = isSpike ? maneRadius + 22 : maneRadius - 6;
    const x = cx + Math.cos(angle) * r;
    const y = cy - 30 + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();

  // Golden Yellow top mane layers
  ctx.fillStyle = "#fbbf24"; // Bright gold yellow
  ctx.beginPath();
  for (let i = 0; i < 28; i++) {
    const angle = (i * Math.PI * 2) / 28;
    const isSpike = i % 2 === 0;
    const r = isSpike ? maneRadius + 5 : maneRadius - 12;
    const x = cx + Math.cos(angle) * r;
    const y = cy - 30 + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();

  // Lion face skin back circle
  ctx.fillStyle = "#eab308";
  ctx.beginPath();
  ctx.arc(cx, cy - 30, 62, 0, Math.PI * 2);
  ctx.fill();

  // Angry muzzle
  ctx.fillStyle = "#78350f"; // Rich bronze brown muzzle skin
  ctx.beginPath();
  ctx.moveTo(cx - 18, cy - 50);
  ctx.lineTo(cx + 18, cy - 50);
  ctx.lineTo(cx + 22, cy - 28);
  ctx.lineTo(cx - 22, cy - 28);
  ctx.closePath();
  ctx.fill();

  // Nose bulb
  ctx.fillStyle = "#0c111d";
  ctx.beginPath();
  ctx.moveTo(cx - 16, cy - 28);
  ctx.lineTo(cx + 16, cy - 28);
  ctx.quadraticCurveTo(cx, cy - 18, cx - 16, cy - 28);
  ctx.fill();

  // Furious Roaring Black Mouth
  ctx.fillStyle = "#090d16"; // Deep black mouth depth
  ctx.beginPath();
  ctx.arc(cx, cy - 12, 32, 0, Math.PI, false);
  ctx.closePath();
  ctx.fill();

  // Sharp White Fangs (Teeth)
  ctx.fillStyle = "#ffffff";
  
  // Upper fangs
  ctx.beginPath();
  ctx.moveTo(cx - 21, cy - 14);
  ctx.lineTo(cx - 16, cy - 4);
  ctx.lineTo(cx - 11, cy - 14);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx + 11, cy - 14);
  ctx.lineTo(cx + 16, cy - 4);
  ctx.lineTo(cx + 21, cy - 14);
  ctx.closePath();
  ctx.fill();

  // Lower fangs
  ctx.beginPath();
  ctx.moveTo(cx - 12, cy + 14);
  ctx.lineTo(cx - 8, cy + 4);
  ctx.lineTo(cx - 4, cy + 14);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx + 4, cy + 14);
  ctx.lineTo(cx + 8, cy + 4);
  ctx.lineTo(cx + 12, cy + 14);
  ctx.closePath();
  ctx.fill();

  // Furious angry eyes (Japanese style mask)
  ctx.fillStyle = "#fef08a"; // Glowing pupils
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 4;

  // Left Eye
  ctx.beginPath();
  ctx.moveTo(cx - 38, cy - 52);
  ctx.quadraticCurveTo(cx - 26, cy - 62, cx - 14, cy - 50);
  ctx.lineTo(cx - 32, cy - 45);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right Eye
  ctx.beginPath();
  ctx.moveTo(cx + 38, cy - 52);
  ctx.quadraticCurveTo(cx + 26, cy - 62, cx + 14, cy - 50);
  ctx.lineTo(cx + 32, cy - 45);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // White angry brows
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(cx - 42, cy - 59);
  ctx.lineTo(cx - 15, cy - 54);
  ctx.moveTo(cx + 42, cy - 59);
  ctx.lineTo(cx + 15, cy - 54);
  ctx.stroke();

  ctx.restore();

  // 5. Draw White Karate Gi & Master Black Belt below the chin
  ctx.save();
  ctx.fillStyle = "#ffffff"; // Bright clean gi
  ctx.strokeStyle = "#0f172a"; // Sharp boundaries
  ctx.lineWidth = 5;
  
  ctx.beginPath();
  ctx.moveTo(cx - 75, cy + 34);
  ctx.lineTo(cx - 100, cy + 125);
  ctx.lineTo(cx + 100, cy + 125);
  ctx.lineTo(cx + 75, cy + 34);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Lapels crossing
  ctx.lineWidth = 7;
  ctx.strokeStyle = "#1e293b"; // Contrasting collar black-coal
  
  // Left Lapel
  ctx.beginPath();
  ctx.moveTo(cx - 65, cy + 34);
  ctx.lineTo(cx + 30, cy + 125);
  ctx.stroke();

  // Right Lapel
  ctx.beginPath();
  ctx.moveTo(cx + 65, cy + 34);
  ctx.lineTo(cx - 30, cy + 125);
  ctx.stroke();

  // Gold emblem embroidery on lapel (館 in beautiful gold)
  ctx.fillStyle = "#eab308";
  ctx.font = "bold 11px sans-serif";
  ctx.fillText("館", cx + 32, cy + 62);

  // Knot of Black Belt at bottom of Gi
  ctx.fillStyle = "#0c0f17"; // Genuine Master Black Belt
  ctx.fillRect(cx - 50, cy + 110, 100, 15);
  
  // Gold rank stripes thread representation on belt right end
  ctx.fillStyle = "#d97706";
  ctx.fillRect(cx + 22, cy + 110, 12, 15);

  // Clenched white karate fists/gloves on left and right sides
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 4.5;

  // Left Fist
  ctx.beginPath();
  ctx.arc(cx - 85, cy + 80, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Draw knuckles/glove ridges on Left Fist
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(cx - 95, cy + 64);
  ctx.lineTo(cx - 95, cy + 96);
  ctx.moveTo(cx - 85, cy + 58);
  ctx.lineTo(cx - 85, cy + 102);
  ctx.moveTo(cx - 75, cy + 64);
  ctx.lineTo(cx - 75, cy + 96);
  ctx.stroke();

  // Thumb wrap on Left Fist
  ctx.beginPath();
  ctx.moveTo(cx - 98, cy + 86);
  ctx.lineTo(cx - 72, cy + 86);
  ctx.stroke();

  // Right Fist
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(cx + 85, cy + 80, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Draw knuckles/glove ridges on Right Fist
  ctx.beginPath();
  ctx.moveTo(cx + 95, cy + 64);
  ctx.lineTo(cx + 95, cy + 96);
  ctx.moveTo(cx + 85, cy + 58);
  ctx.lineTo(cx + 85, cy + 102);
  ctx.moveTo(cx + 75, cy + 64);
  ctx.lineTo(cx + 75, cy + 96);
  ctx.stroke();

  // Thumb wrap on Right Fist
  ctx.beginPath();
  ctx.moveTo(cx + 98, cy + 86);
  ctx.lineTo(cx + 72, cy + 86);
  ctx.stroke();

  ctx.restore();

  // 6. Top "LKCP" gold shield crown-header
  ctx.save();
  ctx.fillStyle = "#090d16"; // Dark base top arch
  ctx.strokeStyle = "#fbbf24"; // Gold boundaries
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(cx, cy - 180, 72, Math.PI * 1.15, Math.PI * 1.85);
  ctx.bezierCurveTo(cx + 45, cy - 225, cx - 45, cy - 225, cx - 62, cy - 200);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // "LKCP" typography centered inside top header
  ctx.fillStyle = "#fef08a"; // Pure shining gold
  ctx.font = "900 18px 'Space Grotesk', 'Inter', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.letterSpacing = "2px";
  ctx.fillText("LKCP", cx, cy - 192);
  ctx.restore();

  // 7. Large Prominent Ribbon Banner curving nicely saying "LIONS" 
  ctx.save();
  
  // Left flap shadow depth 3D
  ctx.fillStyle = "#7f1d1d";
  ctx.beginPath();
  ctx.moveTo(cx - 215, cy + 170);
  ctx.lineTo(cx - 190, cy + 145);
  ctx.lineTo(cx - 190, cy + 205);
  ctx.closePath();
  ctx.fill();

  // Right flap shadow depth 3D
  ctx.beginPath();
  ctx.moveTo(cx + 215, cy + 170);
  ctx.lineTo(cx + 190, cy + 145);
  ctx.lineTo(cx + 190, cy + 205);
  ctx.closePath();
  ctx.fill();

  // Main Ribbon Banner Body (Beautiful Royal blue)
  ctx.fillStyle = "#1d4ed8"; // Rich royal blue
  ctx.strokeStyle = "#fbbf24"; // Gold outer boundary
  ctx.lineWidth = 5;
  
  ctx.beginPath();
  ctx.moveTo(cx - 200, cy + 145);
  ctx.quadraticCurveTo(cx, cy + 170, cx + 200, cy + 145);
  ctx.lineTo(cx + 200, cy + 205);
  ctx.quadraticCurveTo(cx, cy + 230, cx - 200, cy + 205);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Inner white accent stripes
  ctx.strokeStyle = "#f8fafc";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 194, cy + 150);
  ctx.quadraticCurveTo(cx, cy + 175, cx + 194, cy + 150);
  ctx.moveTo(cx - 194, cy + 200);
  ctx.quadraticCurveTo(cx, cy + 225, cx + 194, cy + 200);
  ctx.stroke();

  // GIANT Capitalized "LIONS" typography
  ctx.shadowColor = "rgba(0,0,0,0.85)";
  ctx.shadowBlur = 5;
  ctx.shadowOffsetY = 3;

  ctx.fillStyle = "#f97316"; // Hot atomic orange-red
  ctx.strokeStyle = "#090d16"; // Heavy dark text stroke
  ctx.lineWidth = 6;
  ctx.font = "900 48px 'Space Grotesk', 'Inter', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.letterSpacing = "9px";
  
  ctx.strokeText("LIONS", cx + 4, cy + 176);
  ctx.fillText("LIONS", cx + 4, cy + 176);

  ctx.restore();

  // 8. Bottom shield typography list: "KARATE CLUB" & "PUNE" 
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 2;

  ctx.fillStyle = "#fef08a"; // Fine shining gold
  ctx.font = "bold 20px 'Space Grotesk', sans-serif";
  ctx.textAlign = "center";
  ctx.letterSpacing = "3px";
  ctx.fillText("KARATE CLUB", cx, cy + 252);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 17px 'Space Grotesk', sans-serif";
  ctx.letterSpacing = "5px";
  ctx.fillText("PUNE", cx, cy + 276);

  ctx.restore();

  return canvas.toDataURL("image/png");
}
