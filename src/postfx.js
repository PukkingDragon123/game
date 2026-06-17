import * as THREE from "three";

// Lightweight, dependency-free post-processing: a soft bloom for glow plus a
// painterly colour grade (saturation, warmth, gentle contrast) and a vignette.
// Avoids the examples/jsm EffectComposer so the game stays self-contained.
export function createPostFX(renderer, scene, camera) {
  const quadScene = new THREE.Scene();
  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quadGeo = new THREE.PlaneGeometry(2, 2);

  const opts = { type: THREE.HalfFloatType, depthBuffer: true };
  let sceneRT = new THREE.WebGLRenderTarget(1, 1, opts);
  let brightRT = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
  let blurRTA = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
  let blurRTB = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });

  const brightMat = new THREE.ShaderMaterial({
    uniforms: { tDiffuse: { value: null }, threshold: { value: 0.72 } },
    vertexShader: VERT,
    fragmentShader: `
      varying vec2 vUv; uniform sampler2D tDiffuse; uniform float threshold;
      void main(){
        vec3 c = texture2D(tDiffuse, vUv).rgb;
        float l = dot(c, vec3(0.299,0.587,0.114));
        float k = smoothstep(threshold, threshold+0.25, l);
        gl_FragColor = vec4(c*k, 1.0);
      }`,
  });

  const blurMat = new THREE.ShaderMaterial({
    uniforms: { tDiffuse: { value: null }, dir: { value: new THREE.Vector2(1, 0) }, res: { value: new THREE.Vector2(1, 1) } },
    vertexShader: VERT,
    fragmentShader: `
      varying vec2 vUv; uniform sampler2D tDiffuse; uniform vec2 dir; uniform vec2 res;
      void main(){
        vec2 px = dir / res;
        vec3 sum = texture2D(tDiffuse, vUv).rgb * 0.227;
        sum += texture2D(tDiffuse, vUv + px*1.3846).rgb * 0.316;
        sum += texture2D(tDiffuse, vUv - px*1.3846).rgb * 0.316;
        sum += texture2D(tDiffuse, vUv + px*3.2308).rgb * 0.070;
        sum += texture2D(tDiffuse, vUv - px*3.2308).rgb * 0.070;
        gl_FragColor = vec4(sum, 1.0);
      }`,
  });

  const compositeMat = new THREE.ShaderMaterial({
    uniforms: {
      tScene: { value: null }, tBloom: { value: null },
      bloomStrength: { value: 0.65 }, saturation: { value: 1.18 },
      contrast: { value: 1.06 }, warmth: { value: 0.04 }, vignette: { value: 0.32 },
    },
    vertexShader: VERT,
    fragmentShader: `
      varying vec2 vUv;
      uniform sampler2D tScene; uniform sampler2D tBloom;
      uniform float bloomStrength, saturation, contrast, warmth, vignette;
      vec3 toSRGB(vec3 c){ return pow(clamp(c,0.0,1.0), vec3(1.0/2.2)); }
      void main(){
        vec3 col = texture2D(tScene, vUv).rgb;
        col += texture2D(tBloom, vUv).rgb * bloomStrength;          // glow
        float l = dot(col, vec3(0.299,0.587,0.114));                // saturation
        col = mix(vec3(l), col, saturation);
        col = (col - 0.5) * contrast + 0.5;                         // contrast
        col += vec3(warmth, warmth*0.35, -warmth*0.5);              // warm tint
        float d = distance(vUv, vec2(0.5));                         // vignette
        col *= smoothstep(0.85, 0.35, d * vignette + (1.0-vignette)*d);
        gl_FragColor = vec4(toSRGB(max(col, 0.0)), 1.0);
      }`,
  });

  const quad = new THREE.Mesh(quadGeo, compositeMat);
  quadScene.add(quad);

  // we encode sRGB ourselves in the composite, so keep the canvas pass linear
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

  let W = 1, H = 1;
  function setSize(w, h) {
    W = w; H = h;
    const dpr = renderer.getPixelRatio();
    const fw = Math.floor(w * dpr), fh = Math.floor(h * dpr);
    const bw = Math.max(1, fw >> 1), bh = Math.max(1, fh >> 1);
    sceneRT.setSize(fw, fh);
    brightRT.setSize(bw, bh);
    blurRTA.setSize(bw, bh);
    blurRTB.setSize(bw, bh);
    blurMat.uniforms.res.value.set(bw, bh);
  }

  function drawQuad(mat, target) {
    quad.material = mat;
    renderer.setRenderTarget(target || null);
    renderer.render(quadScene, quadCam);
  }

  function render() {
    // 1) scene -> RT
    renderer.setRenderTarget(sceneRT);
    renderer.clear();
    renderer.render(scene, camera);
    // 2) bright pass
    brightMat.uniforms.tDiffuse.value = sceneRT.texture;
    drawQuad(brightMat, brightRT);
    // 3) blur H then V
    blurMat.uniforms.tDiffuse.value = brightRT.texture;
    blurMat.uniforms.dir.value.set(1, 0);
    drawQuad(blurMat, blurRTA);
    blurMat.uniforms.tDiffuse.value = blurRTA.texture;
    blurMat.uniforms.dir.value.set(0, 1);
    drawQuad(blurMat, blurRTB);
    // 4) composite -> screen
    compositeMat.uniforms.tScene.value = sceneRT.texture;
    compositeMat.uniforms.tBloom.value = blurRTB.texture;
    drawQuad(compositeMat, null);
  }

  return { setSize, render };
}

const VERT = `
  varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;
