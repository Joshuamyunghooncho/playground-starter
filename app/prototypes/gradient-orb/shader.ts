// GLSL sources (WebGL 1). Ported unchanged from the original Gradient Orb Studio.
// Uniform names must match renderer.ts.

export const MAX_COLORS = 8

export const VERTEX_SHADER = "attribute vec2 a; void main(){ gl_Position = vec4(a,0.,1.); }"

export const FRAGMENT_SHADER = /* glsl */ `
precision highp float;
uniform vec2  u_res;
uniform float u_flow;
uniform float u_hue;
uniform float u_stretch;
uniform float u_angle;
uniform float u_gloss;
uniform float u_gap;
uniform float u_topR;
uniform float u_botR;
uniform float u_thick;
uniform float u_soft;
uniform float u_breath;
uniform vec3  u_colors[${MAX_COLORS}];
uniform int   u_count;

uniform sampler2D u_img;
uniform sampler2D u_glyphs;
uniform float u_hasImg;
uniform float u_imgAspect;
uniform float u_imgScale;
uniform float u_imgY;
uniform float u_imgRad;
uniform float u_auraInt;
uniform float u_auraSp;
uniform float u_auraTerm;   // distance for one palette cycle (smaller = tighter)
uniform float u_auraHue;    // palette phase at the image edge
uniform float u_auraFlow;   // aura outflow speed multiplier
uniform float u_auraRing;   // ring (wave) contrast
uniform float u_texMode;    // 0 none / 1 dots / 2 squares / 3 digits / 4 letters
uniform float u_cell;
uniform float u_texInt;

vec3 getColor(int i){ for(int k=0;k<${MAX_COLORS};k++){ if(k==i) return u_colors[k]; } return vec3(0.); }

vec3 palette(float t){
  t = fract(t);
  float n = float(u_count);
  float seg = t*n;
  int i = int(floor(seg));
  int j = i+1; if(j>=u_count) j=0;
  float f = fract(seg);
  float fs2 = mix(f, f*f*(3.0-2.0*f), u_soft);
  return mix(getColor(i), getColor(j), fs2);
}

vec2 toP(vec2 fx){
  vec2 uv = fx / u_res;
  vec2 p = (uv - 0.5) * 2.0;
  p.x *= u_res.x / u_res.y;
  return p;
}

// Rounded-rect SDF for the uploaded image (unstretched coordinates)
float imgSDF(vec2 p){
  vec2 h = vec2(u_imgScale * u_imgAspect, u_imgScale);
  vec2 q = abs(p - vec2(0.0, u_imgY)) - h + u_imgRad;
  return length(max(q, 0.0)) - u_imgRad;
}

// Whole scene (background + arch + dome + aura), re-sampled per cell in texture modes
vec3 scene(vec2 p, vec2 uv){
  float ph = u_hue;
  float fl = u_flow;

  float ca = cos(u_angle), sa = sin(u_angle);
  vec2 pr = vec2(p.x*ca - p.y*sa, p.x*sa + p.y*ca);
  pr.x *= u_stretch;

  vec3 col = palette(ph + 0.02 + pr.y*0.11);

  // ----- bottom: 3D arch -----
  {
    float crest = -0.10 - u_gap + u_breath*0.02;
    float R = u_botR * (1.0 + u_breath*0.03);
    vec2 c = vec2(0.0, crest - R);
    float d = length(pr - c);
    float s = d - R;

    float ext = smoothstep(1.15, 0.02, s) * step(0.0, s);
    vec3 ec = palette(ph - fl + 0.86 + min(s,1.2)*0.10);
    ec *= exp(-max(s,0.0)*1.35) * 1.05;
    col = mix(col, ec, ext);

    float inn = smoothstep(0.02, -0.02, s);
    float depth = clamp(-s, 0.0, 1.4);
    vec3 ic = palette(ph + fl + 0.38 + depth*0.30);
    ic *= mix(0.85, 1.12, smoothstep(0.0, 0.6, depth));
    col = mix(col, ic, inn);

    float w = u_thick;
    float hi  = exp(-pow((s + w*0.55)/(w*0.45), 2.0));
    float mid = exp(-pow((s - w*0.10)/(w*0.80), 2.0));
    float dk  = exp(-pow((s - w*0.95)/(w*0.55), 2.0));
    vec3 tubeBase = palette(ph + 0.82);
    col = mix(col, tubeBase*0.90, clamp(mid,0.,1.)*0.85);
    col = mix(col, tubeBase*0.28, clamp(dk,0.,1.)*0.90);
    col = mix(col, tubeBase*1.50 + 0.10, clamp(hi,0.,1.)*u_gloss);
  }

  // ----- top: hanging dome -----
  {
    float edge = 0.10 + u_gap - u_breath*0.02;
    float R = u_topR * (1.0 + u_breath*0.03);
    vec2 c = vec2(0.0, edge + R);
    float d = length(pr - c);
    float s = d - R;

    float ext = exp(-max(s,0.0)*2.1) * step(0.0, s);
    vec3 ec = palette(ph - fl + 0.09 + min(s,1.2)*0.50);
    ec *= mix(1.0, 1.25, exp(-max(s,0.0)*4.5));
    col = mix(col, ec, ext);

    float inn = smoothstep(0.02, -0.02, s);
    float depth = clamp(-s, 0.0, 1.4);
    vec3 ic = palette(ph - fl + 0.78 - depth*0.30);
    ic *= mix(0.70, 1.16, smoothstep(0.0, 0.75, depth));
    col = mix(col, ic, inn);

    float w = u_thick*0.7;
    float hot = exp(-pow((s - w*0.25)/(w*0.40), 2.0));
    float sub = exp(-pow((s - w*0.90)/(w*0.70), 2.0));
    col = mix(col, palette(ph+0.15)*1.35, clamp(hot,0.,1.)*u_gloss);
    col = mix(col, palette(ph+0.09)*1.10, clamp(sub,0.,1.)*u_gloss*0.5);
  }

  // ----- image aura: radiates outward from the image edge -----
  if(u_hasImg > 0.5){
    float dr = imgSDF(p);
    if(dr > 0.0){
      float phase = dr / max(u_auraTerm, 0.01) - fl * u_auraFlow;
      float a = exp(-dr / max(u_auraSp, 0.01));
      vec3 ac = palette(ph + u_auraHue + phase) * 1.2;
      float ring = 0.5 + 0.5*cos(phase * 6.2831853);
      a *= mix(1.0, ring, u_auraRing);
      col = mix(col, ac, clamp(a * u_auraInt, 0.0, 1.0));
    }
  }

  return col;
}

void main(){
  vec2 fx = gl_FragCoord.xy;
  vec3 col;

  if(u_texMode < 0.5){
    col = scene(toP(fx), fx / u_res);
  } else {
    // halftone / glyph texture: sample the scene at each cell centre
    float cell = u_cell;
    vec2 id = floor(fx / cell);
    vec2 cc = (id + 0.5) * cell;
    vec3 cellCol = scene(toP(cc), cc / u_res);
    float lum = dot(cellCol, vec3(0.299, 0.587, 0.114));
    vec2 f = fx / cell - id - 0.5;
    float mask = 0.0;

    if(u_texMode < 1.5){
      float r = 0.10 + lum * 0.40;
      mask = smoothstep(r, r - 0.08, length(f));
    } else if(u_texMode < 2.5){
      float r = 0.08 + lum * 0.38;
      vec2 a2 = abs(f);
      mask = smoothstep(r, r - 0.06, max(a2.x, a2.y));
    } else {
      float row = (u_texMode < 3.5) ? 1.0 : 0.0;
      float gi = floor(clamp(lum, 0.0, 0.999) * 10.0);
      vec2 guv = vec2((gi + (f.x + 0.5)) / 10.0, (row + (f.y + 0.5)) / 2.0);
      mask = texture2D(u_glyphs, guv).a;
    }

    vec3 texCol = mix(cellCol * 0.05, min(cellCol * 1.2 + 0.05, vec3(1.0)), mask);
    vec3 smoothCol = scene(toP(fx), fx / u_res);
    col = mix(smoothCol, texCol, u_texInt);
  }

  // uploaded image, composited crisply on top
  if(u_hasImg > 0.5){
    vec2 p = toP(fx);
    float dr = imgSDF(p);
    float aa = 2.0 / u_res.y * 1.5;
    float inMask = smoothstep(aa, -aa, dr);
    if(inMask > 0.001){
      vec2 h = vec2(u_imgScale * u_imgAspect, u_imgScale);
      vec2 iuv = (p - vec2(0.0, u_imgY)) / (2.0 * h) + 0.5;
      vec3 icol = texture2D(u_img, clamp(iuv, 0.0, 1.0)).rgb;
      col = mix(col, icol, inMask);
    }
  }

  vec2 pv = toP(fx);
  float vg = smoothstep(2.1, 0.5, length(pv));
  col *= mix(0.93, 1.0, vg);
  float dither = (fract(sin(dot(fx, vec2(12.9898,78.233)))*43758.5453)-0.5)/255.0;
  col += dither;

  gl_FragColor = vec4(col, 1.0);
}
`
