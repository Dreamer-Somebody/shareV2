'use strict';

var main = {
  init: function init(o) {
    var _this = this;

    this.vars();this.initContainer();this.initClose();this.initHideClose();
    this.prepareSprites();this.events();this.draw();
    setInterval(function () {
      _this.updateProgress(false);
    }, 10);
    return this;
  },
  initContainer: function initContainer() {
    this.iscroll = new IScroll('#js-wrapper', {
      scrollX: true, freeScroll: true, mouseWheel: true, probeType: 3
    });
    var x = -this.centerX + this.wWidth / 2 + this.xOffset,
        y = -this.centerY + this.wHeight / 2 + this.yOffset;
    this.iscroll.scrollTo(x, y, 10);
  },
  vars: function vars() {
    this.S = 1;this.loadCnt = 0;this.maxLoadCnt = 8;
    this.BLOB_DURATION = 500;
    this.ext = this.isCanPlayMP3() ? 'mp3' : 'wav';
    this.isIE = this.isIE();
    this.isIOS = !!/(iPad|iPhone|iPod)/g.test(navigator.userAgent);
    this.isIOS && document.body.classList.add('ios');
    !this.isTabletMobile && document.body.classList.add('desktop');
    this.progressStep = 150 / this.maxLoadCnt * (1 / 16);

    this.getDOMElements();

    this.particleRadius = parseInt(getComputedStyle(this.particles[0]).width, 10) / 2;
    this.particlesLength = this.particles.length;

    this.radPoint = mojs.helpers.getRadialPoint;
    this.particleBuffer = null;this.isOpen = false;
    this.blobBase = 1.6;this.blob = this.blobBase;this.blobShift = this.blobBase;
    this.xOffset = this.particleRadius + 25;
    this.yOffset = 1.4 * this.particleRadius;

    var styles = getComputedStyle(this.particlesContainer);
    this.width = parseInt(styles.width, 10);this.height = parseInt(styles.height, 10);

    this.prepareDust();this.calcDimentions();this.loadAssets();

    var i = this.particlesLength;
    while (i--) {
      var particle = this.particles[i];
      particle.x = parseInt(particle.getAttribute('data-left'), 10);
      particle.y = parseInt(particle.getAttribute('data-top'), 10);
    }
  },
  getDOMElements: function getDOMElements() {
    this.particlesContainer = document.querySelector('#scroller');
    this.particles = document.querySelectorAll('.particle');
    this.closeBtn = document.querySelector('#js-close-btn');
    this.blobCircle = document.querySelector('#js-blob-circle');
    this.blobEllipses = this.blobCircle.querySelectorAll('#js-blob-circle-ellipse');
    this.dust1 = document.querySelector('#js-dust-1');
    this.dust2 = document.querySelector('#js-dust-2');
    this.dust3 = document.querySelector('#js-dust-3');
    this.dust4 = document.querySelector('#js-dust-4');
    this.content = document.querySelector('#js-content');
    this.curtain = document.querySelector('#js-curtain');
    this.progress = document.querySelector('#js-progress');
    this.progressGrad = document.querySelector('#js-progress-gradient');
  },
  draw: function draw() {
    var origin = this.bubleCenter.x + 'px ' + this.bubleCenter.y + 'px',
        h = mojs.h,
        inEasing = mojs.easing.cubic.in,
        i = this.particlesLength;

    h.setPrefixedStyle(this.particlesContainer, 'perspective-origin', origin);

    while (i--) {
      this.particleBuffer = this.particles[i];
      var x = Math.abs(this.bubleCenter.x - this.particleBuffer.x),
          y = Math.abs(this.bubleCenter.y - this.particleBuffer.y),
          radius = Math.sqrt(x * x + y * y),
          a = this.blob - 2 * radius / this.size,
          b = this.blobShift - 2 * radius / this.size,
          scaleMax = 1;

      var delta = mojs.helpers.clamp(inEasing(a), 0.03, scaleMax),
          deltaShift = h.clamp(inEasing(b), 0.03, scaleMax),
          isDeltaChanged = this.particleBuffer.prevDelta !== delta;

      if (isDeltaChanged || this.particleBuffer.prevDeltaShift !== deltaShift) {
        var translateZ = -150 * inEasing(1 - deltaShift),
            transform = 'scale(' + delta + ') translateZ(' + translateZ + 'px)';
        h.setPrefixedStyle(this.particleBuffer, 'transform', transform);
        this.particleBuffer.prevDelta = delta;
        this.particleBuffer.prevDeltaShift = deltaShift;
      }
    }
    requestAnimationFrame(this.draw.bind(this));
  },
  calcDimentions: function calcDimentions() {
    this.wWidth = window.innerWidth;this.wHeight = window.innerHeight;
    this.centerY = this.height / 2 - this.wHeight / 2;
    this.centerX = this.width / 2 - this.wWidth / 2;
    this.bubleCenter = { x: this.centerX, y: this.centerY };
    var x = Math.sqrt(this.wHeight * this.wHeight),
        y = Math.sqrt(this.wWidth * this.wWidth);
    this.size = 1 * Math.min(x, y);
  },
  start: function start() {
    this.curtain.classList.add('is-hide');this.startBlob();
  },
  startBlob: function startBlob() {
    var _this2 = this;

    var tween = new mojs.Tween();
    var t = new mojs.Timeline({
      duration: 1200 * this.S,
      onUpdate: function onUpdate(p) {
        _this2.blob = _this2.blobBase + .3 * (1 - mojs.easing.elastic.out(p));
      }
    });

    var centerX = this.bubleCenter.x,
        centerY = this.bubleCenter.y;

    var t2 = new mojs.Timeline({
      duration: 1200 * this.S, delay: 0 * this.S,
      onUpdate: function onUpdate(p) {
        _this2.blobShift = _this2.blobBase + .5 * (1 - mojs.easing.elastic.out(p));
      },
      onStart: function onStart() {
        _this2.closeScaleSound.play();
      }
    });
    tween.add(t, t2);tween.start();
  },
  updateProgress: function updateProgress() {
    var isReturn = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];

    if (isReturn) {
      return;
    }
    var shift = (this.maxLoadCnt - ++this.loadCnt) * this.progressStep;
    this.progress.style.width = shift + 'rem';
    mojs.h.setPrefixedStyle(this.progressGrad, 'transform', 'translateX(-' + this.loadCnt * this.progressStep / 1.3 + 'rem)');
    this.loadCnt === this.maxLoadCnt && this.start();
  },
  loadAssets: function loadAssets() {
    this.openSound = new Howl({ urls: ['https://s3-us-west-2.amazonaws.com/s.cdpn.io/6859/open-bubble-2.' + this.ext], onload: this.updateProgress.bind(this) });
    this.openSound2 = new Howl({ urls: ['https://s3-us-west-2.amazonaws.com/s.cdpn.io/6859/open-bubble-3.' + this.ext], rate: .15, onload: this.updateProgress.bind(this) });
    this.bounceSound = new Howl({ urls: ['https://s3-us-west-2.amazonaws.com/s.cdpn.io/6859/bounce.' + this.ext] });
    this.closeSound = new Howl({ urls: ['https://s3-us-west-2.amazonaws.com/s.cdpn.io/6859/bubble-single-1.' + this.ext], rate: .5, onload: this.updateProgress.bind(this) });
    this.closeSound2 = new Howl({ urls: ['https://s3-us-west-2.amazonaws.com/s.cdpn.io/6859/bubble-single-1.' + this.ext], rate: .75, onload: this.updateProgress.bind(this) });
    this.closeSound3 = new Howl({ urls: ['https://s3-us-west-2.amazonaws.com/s.cdpn.io/6859/bubble-single-1.' + this.ext], rate: .85, onload: this.updateProgress.bind(this) });
    this.closeScaleSound = new Howl({ urls: ['https://s3-us-west-2.amazonaws.com/s.cdpn.io/6859/open-bubble-3.' + this.ext], rate: .25, onload: this.updateProgress.bind(this) });
    this.closeBtnSound = new Howl({ urls: ['https://s3-us-west-2.amazonaws.com/s.cdpn.io/6859/open-bubble-3.' + this.ext], rate: 1, onload: this.updateProgress.bind(this) });
    this.loadImage('https://s3-us-west-2.amazonaws.com/s.cdpn.io/6859/mojs-logo.png');
  },
  loadImage: function loadImage(url) {
    var image = new Image();
    image.addEventListener('load', this.updateProgress.bind(this), false);
    image.addEventListener('error', this.updateProgress.bind(this), false);
    image.src = url;
  },
  isCanPlayMP3: function isCanPlayMP3() {
    var userAgent = navigator.userAgent;
    return !(userAgent.indexOf("Opera") && userAgent.indexOf('firefox') > -1);
  },
  isIE: function isIE() {
    return !!(window.navigator.msPointerEnabled && !window.PointerEvent);
  },
  isTabletMobile: function () {
    return (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    );
  }(),

  setBubblePosition: function setBubblePosition() {
    this.bubleCenter.x = -this.iscroll.x + this.wWidth / 2 + this.xOffset;
    this.bubleCenter.y = -this.iscroll.y + this.wHeight / 2 + this.yOffset;
  },

  events: function events() {
    var _this3 = this;

    window.addEventListener('resize', function () {
      _this3.calcDimentions();_this3.setBubblePosition();
    });
    new Hammer(document.body).on('tap', function (e) {
      var el = e.target.parentNode;
      if (_this3.isOpen) {
        return e.preventDefault();
      }
      if (el.classList.contains('particle')) {
        _this3.showOnEl(el);
      } else if (el.parentNode.classList.contains('particle')) {
        _this3.showOnEl(el.parentNode);
      }
    });
    new Hammer(this.closeBtn).on('tap', this.closeEl.bind(this));
    document.addEventListener('touchmove', function (e) {
      e.preventDefault();
    }, false);
    this.iscroll.on('scroll', this.setBubblePosition.bind(this));
  },
  initClose: function initClose() {
    var _this4 = this;

    var dur = 400 * this.S;
    var closeOption = {
      parent: document.querySelector('#js-close-btn'),
      type: 'circle',
      radius: { 0: 15 },
      fill: 'transparent',
      stroke: 'white',
      strokeWidth: { 5: 0 },
      x: '50%', y: '50%',
      duration: dur,
      isRunLess: true
    };
    this.closeCircle = new mojs.Transit(closeOption);

    var closeCrossOption = {
      type: 'cross',
      delay: .4 * dur,
      angle: 45,
      strokeWidth: 2,
      radius: { 0: 8 },
      isShowEnd: true,
      onStart: function onStart() {
        _this4.closeSound.play();
      }
    };
    mojs.h.extend(closeCrossOption, closeOption);
    this.closeCross = new mojs.Transit(closeCrossOption);

    var closeBurstOption = {
      type: 'line',
      radius: { 0: 30 },
      strokeWidth: { 4: 0 },
      delay: .4 * dur,
      childOptions: { radius: { 5: 0 } }
    };
    mojs.h.extend(closeBurstOption, closeOption);
    this.closeBurst = new mojs.Burst(closeBurstOption);

    var closeOption2 = {
      parent: document.querySelector('#js-close-btn'),
      type: 'circle',
      radius: { 0: 10 },
      fill: 'transparent',
      stroke: 'white',
      strokeWidth: { 5: 0 },
      x: '-20%', y: '-50%',
      isRunLess: true,
      delay: .7 * dur,
      duration: 400 * this.S,
      onStart: function onStart() {
        _this4.closeSound2.play();
      }
    };
    this.closeCircle2 = new mojs.Transit(closeOption2);

    var closeOption3 = {
      x: '80%', y: '-30%',
      radius: { 0: 6 },
      delay: 1.1 * dur,
      duration: 300 * this.S,
      onStart: function onStart() {
        _this4.closeSound3.play();
      }
    };
    mojs.h.extend(closeOption3, closeOption2);
    this.closeCircle3 = new mojs.Transit(closeOption3);

    var closeOption4 = {
      x: '50%', y: '130%',
      radius: { 0: 4 },
      delay: .9 * dur,
      duration: 200 * this.S,
      onStart: function onStart() {
        _this4.closeSound3.play();
      }
    };
    mojs.h.extend(closeOption4, closeOption2);
    this.closeCircle4 = new mojs.Transit(closeOption4);

    this.showCloseBtnTween = new mojs.Tween();
    this.showCloseBtnTween.add(this.closeCircle.tween, this.closeCircle2.tween, this.closeCircle3.tween, this.closeCircle4.tween, this.closeCross.tween, this.closeBurst.tween);
  },
  showClose: function showClose() {
    this.closeBtn.classList.add('is-show');this.showCloseBtnTween.start();
  },
  initHideClose: function initHideClose() {
    var _this5 = this;

    this.hideBurst = new mojs.Burst({
      x: '50%', y: '50%',
      parent: this.closeBtn,
      radius: { 0: 100 },
      type: 'circle',
      fill: 'white',
      degree: 25,
      isSwirl: true,
      randomRadius: 1,
      isRunLess: true,
      childOptions: { radius: { 'rand(12,5)': 0 } },
      duration: 500 * this.S,
      onUpdate: function onUpdate(p) {
        p = mojs.easing.cubic.in(p);
        mojs.h.setPrefixedStyle(_this5.closeCross.el, 'transform', 'scale(' + (1 - p) + ')');
      },
      onStart: function onStart() {
        _this5.closeBtnSound.play();
      },
      onComplete: function onComplete() {
        _this5.closeBtn.classList.remove('is-show');
        mojs.h.setPrefixedStyle(_this5.closeCross.el, 'transform', 'none');
      }
    });
    this.hideCircle = new mojs.Transit({
      x: '50%', y: '50%',
      parent: this.closeBtn,
      type: 'circle',
      radius: { 0: 15 },
      fill: 'transparent',
      stroke: 'white',
      strokeWidth: { 8: 0 },
      isRunLess: true,
      duration: 500 * this.S
    });
  },
  hideClose: function hideClose() {
    this.hideBurst.run();this.hideCircle.run();
  },
  closeEl: function closeEl() {
    var _this6 = this;

    this.iscroll.enabled = true;this.isOpen = false;this.hideClose();

    var innerEl = this.currentEl.querySelector('.particle__inner'),
        scaleDownTween = new mojs.Tween();

    var scaleDownTimeline = new mojs.Timeline({
      duration: 500 * this.S,
      onUpdate: function onUpdate(p) {
        var np = 1 - p,
            npe = mojs.easing.cubic.inout(np),
            scaleSize = .75 + 18 * npe,
            scale = 'scale(' + scaleSize + ')';

        mojs.h.setPrefixedStyle(innerEl, 'transform', scale);
        mojs.h.setPrefixedStyle(_this6.content, 'transform', 'scale(' + npe + ')');
      }
    });

    var scaleDownSoundTimeline = new mojs.Timeline({
      delay: 0 * this.S, onStart: function onStart() {
        _this6.closeScaleSound.play();
      }
    });

    var scaleUpTimeline = new mojs.Timeline({
      duration: 1000 * this.S,
      onUpdate: function onUpdate(p) {
        var scaleSize = .75 + .25 * mojs.easing.elastic.out(p),
            scale = 'scale(' + scaleSize + ')';
        mojs.h.setPrefixedStyle(innerEl, 'transform', scale);
      },
      onComplete: function onComplete() {
        if (_this6.isOpen) {
          return mojs.h.setPrefixedStyle(_this6.content, 'transform', 'translate3d(-5000px,-5000px,0)');
        }
        mojs.h.setPrefixedStyle(_this6.content, 'transform', 'translate3d(-5000px,-5000px,0)');
      }
    });
    scaleDownTween.add(scaleDownTimeline);scaleDownTween.append(scaleUpTimeline);

    var blobTween = new mojs.Tween();
    var blobShiftDownTimeline = new mojs.Timeline({
      duration: 1200 * this.S, delay: 300 * this.S,
      onUpdate: function onUpdate(p) {
        if (_this6.isOpen) {
          return;
        }
        _this6.blobShift = _this6.blobBase + (1 - mojs.easing.elastic.out(p));
      }
    });
    var blobDownTimeline = new mojs.Timeline({
      duration: 2100 * this.S, delay: 0 * this.S,
      onUpdate: function onUpdate(p) {
        if (_this6.isOpen) {
          return;
        }
        _this6.blob = _this6.blobBase + .3 * (1 - mojs.easing.elastic.out(p));
      }
    });

    blobTween.add(blobShiftDownTimeline, blobDownTimeline, scaleDownSoundTimeline);

    this.jellyTween = new mojs.Tween();
    this.jellyTween.add(scaleDownTween, blobTween);
    this.jellyTween.start();
  },
  moveTextEl: function moveTextEl(el, p) {
    p = mojs.easing.cubic.out(p);
    var transform = 'rotate(' + 90 * (1 - p) + 'deg) translateY(' + 200 * (1 - p) + '%)',
        transformOrigin = 'left ' + 80 * p + '%';
    mojs.h.setPrefixedStyle(el, 'transform', transform);
    mojs.h.setPrefixedStyle(el, 'transform-origin', transformOrigin);
    el.style.opacity = mojs.easing.cubic.out(p);
  },

  prepareDust: function prepareDust() {
    this.dust1Spriter = new mojs.Spriter({
      el: this.dust1,
      duration: 300 * this.S,
      delay: 275 * this.S,
      isRunLess: true
    });
    this.dust2Spriter = new mojs.Spriter({
      el: this.dust2,
      duration: 200 * this.S,
      delay: 575 * this.S,
      isRunLess: true
    });
    this.dust3Spriter = new mojs.Spriter({
      el: this.dust3,
      duration: 100 * this.S,
      delay: 725 * this.S,
      isRunLess: true
    });
  },

  runDust: function runDust() {
    if (this.isTabletMobile || this.isIE) {
      return;
    };
    this.dust1Spriter.run();this.dust2Spriter.run();
    this.dust3Spriter.run();
  },

  showInnerPlastic: function showInnerPlastic(el) {
    var _this7 = this;

    var tween = new mojs.Tween(),
        image = el.querySelector('.image'),
        scene = el.querySelector('.shape'),
        shadow = el.querySelector('#js-shadow'),
        shadowWrap = el.querySelector('#js-shadow-wrap');

    this.runDust();

    var mp = new mojs.MotionPath({
      path: { x: -300, y: -300 },
      curvature: { x: '75%', y: '50%' },
      offsetX: 300,
      offsetY: 300,
      el: image,
      duration: this.isIE ? 200 * this.S : 1000 * this.S,
      easing: 'cubic.out',
      onPosit: function onPosit(p, x, y, angle) {
        p = mojs.easing.expo.out(mojs.easing.cubic.in(p));
        var rotate = 'rotateX(70deg) rotateZ(' + -60 * (1 - p) + 'deg)',
            translate = 'translateX(' + x + 'px) translateY(' + y + 'px)',
            scale = 'scaleY(' + (2.5 - 1.5 * p) + ')';
        mojs.h.setPrefixedStyle(shadow, 'transform', translate + ' ' + rotate + ' ' + scale);
        return 'translate(' + x + 'px, ' + y + 'px)';
      }
    });

    var opacityEasing = mojs.easing.path('M0,0 C0,0 32.1191406,0.314142863 40.1669859,0 C40.1669859,0.165327852 50.9999996,-112.569017 74.0660521,0 C80.8905119,-16.0420643 87.1001393,-19.621745 92.0689049,0 C92.0689049,1.54522552 95.3231688,-14.8615687 100,0'),
        bounceEasing = mojs.easing.path('M0,100 C28.3125,98.6523445 39.0445328,8.99375039 40.1669859,0 C40.1669859,-0.0485295402 50.9999996,152.873952 74.0660521,0 C80.8905119,21.9365596 87.1001393,26.7923438 92.0689049,0 C92.0689049,-1.92034044 95.3231688,20.3352347 100,0');

    var timeline1 = new mojs.Timeline({
      duration: this.isIE ? 200 * this.S : 800 * this.S,
      onStart: function onStart() {
        mojs.h.setPrefixedStyle(_this7.content, 'transform', 'translate3d(0,0,0)');
      },
      onComplete: function onComplete() {
        _this7.showClose();
      },
      onUpdate: function onUpdate(p) {
        var b = mojs.easing.bounce.out(p),
            bin = mojs.easing.bounce.in(p),
            t = mojs.easing.cubic.out(p),
            rotate = 'rotateY(' + 90 * (1 - b) + 'deg) rotateX(' + 70 * (1 - t) + 'deg) rotateZ(' + 90 * (1 - t) + 'deg)',
            scale = 'scaleX(' + opacityEasing(p) + ')',
            transform = 'translate(' + (-300 * mojs.easing.bounce.in(1 - p) - 5) + 'px, 2px) ' + scale;
        mojs.h.setPrefixedStyle(scene, 'transform', '' + rotate);
        mojs.h.setPrefixedStyle(scene, 'transform-origin', 50 + 50 * t + '% 100%');
        mojs.h.setPrefixedStyle(shadowWrap, 'transform', transform);
        scene.style.opacity = mojs.easing.expo.out(p);
        shadow.style.opacity = .75 * bounceEasing(p);
      }
    });

    var soundTimeline = new mojs.Timeline({
      delay: 300 * this.S, onStart: function onStart() {
        if (_this7.isIE) {
          return;
        };_this7.bounceSound.play();
      }
    });

    tween.add(timeline1, soundTimeline);
    tween.start();
  },
  prepareSprites: function prepareSprites() {
    this.blobSprite = new mojs.Spriter({
      el: this.blobCircle,
      duration: this.BLOB_DURATION * this.S,
      isRunLess: true
    });
  },

  showInnerCircle: function showInnerCircle(x, y) {
    var _this8 = this;

    this.blobCircle.style.left = x + 'px';
    this.blobCircle.style.top = y + 'px';

    var tween = new mojs.Tween(),
        size = Math.min(this.wWidth, this.wHeight),
        borderWidth = Math.min(10 * mojs.easing.cubic.in(size / 800), 20),
        blobCircleSize = 30 + 2 * borderWidth,
        strokeStep = borderWidth / 2 / this.blobEllipses.length,
        i = 0;

    for (var i = 0; i < this.blobEllipses.length; i++) {
      var item = this.blobEllipses[i];
      item.setAttribute('stroke-width', borderWidth / 2 - i * strokeStep);
      item.setAttribute('rx', blobCircleSize / 2);
      item.setAttribute('ry', blobCircleSize / 2);
    };

    this.blobCircle.style.display = 'block';
    var blobCircleTm = new mojs.Timeline({
      duration: this.BLOB_DURATION * this.S,
      onStart: function onStart() {
        _this8.blobSprite.run();
        _this8.openSound.play();
      },
      onUpdate: function onUpdate(p) {
        var tr = 'scale(' + 28 * p + ')';
        mojs.h.setPrefixedStyle(_this8.blobCircle, 'transform', tr);
        _this8.blobCircle.style.opacity = 1 * mojs.easing.cubic.in(1 - p);
      }
    });

    tween.add(blobCircleTm);
    tween.start();
  },

  showOnEl: function showOnEl(el) {
    var _this9 = this;

    this.prevEl = this.currentEl;this.currentEl = el;
    this.prevEl && (this.prevEl.style['z-index'] = 0);
    // return immediately on edges
    if (el.delta < .2) {
      return;
    }
    var x = el.x - this.wWidth / 2 - this.xOffset,
        y = el.y - this.wHeight / 2 - this.yOffset,
        innerEl = el.querySelector('.particle__inner'),
        contentEl = el.querySelector('.particle__content'),
        tween = new mojs.Tween();

    this.isOpen = true;el.style['z-index'] = 20;this.iscroll.enabled = false;
    this.showInnerCircle(el.x + 75, el.y + 75);this.iscroll.scrollTo(-x, -y, 500 * this.S);

    var soundTimeline = new mojs.Timeline({
      delay: 0 * this.S, onStart: function onStart() {
        _this9.openSound2.play();
      }
    });

    var scaleDownTween = new mojs.Timeline({
      duration: 300 * this.S, easing: 'expo.out',
      onUpdate: function onUpdate(p) {
        mojs.h.setPrefixedStyle(innerEl, 'transform', 'scale(' + (1 - .25 * p) + ')');
        innerEl.style.opacity = 1 - .25 * p;
      }
    });

    var blobTimeline = new mojs.Timeline({
      duration: 600 * this.S, delay: 100 * this.S,
      onUpdate: function onUpdate(p) {
        _this9.blob = _this9.blobBase + .3 * mojs.easing.cubic.out(p);
        _this9.blobShift = _this9.blobBase + 1 * p;
      }
    });

    mojs.h.setPrefixedStyle(this.content, 'transform', 'translate3d(-5000px,-5000px,0)');

    var scaleUpTimeline = new mojs.Timeline({
      duration: 600 * this.S, delay: 350 * this.S,
      onUpdate: function onUpdate(p) {
        var scaleSize = 19 * mojs.easing.cubic.in(p);
        scaleSize = Math.max(.75, scaleSize);
        var scale = 'scale(' + scaleSize + ')';
        mojs.h.setPrefixedStyle(innerEl, 'transform', scale);
        innerEl.style.opacity = .75 + .25 * mojs.easing.cubic.out(p);
      },
      onStart: function onStart() {
        setTimeout(function () {
          _this9.showInnerPlastic(_this9.content);
        }, 400);
      },
      onComplete: function onComplete() {
        _this9.blobCircle.style.display = 'none';
      }
    });

    tween.add(scaleDownTween, soundTimeline, blobTimeline, scaleUpTimeline);
    tween.start();
  }
};
main.init();