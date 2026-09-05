(function() {
    function isCrossColor(color) {
        return typeof color === "string" && (color.indexOf("http://") === 0 || color.indexOf("https://") === 0);
    }

    function ensureCrossColorSheet(color) {
        if (!isCrossColor(color)) return;
        if (window.BonziHandler && window.BonziHandler.spriteSheets && !window.BonziHandler.spriteSheets[color]) {
            var d = {
                images: [color],
                frames: window.BonziData.sprite.frames,
                animations: window.BonziData.sprite.animations
            };
            window.BonziHandler.spriteSheets[color] = new createjs.SpriteSheet(d);
        }
    }

    $(document).ready(function() {
        var patchInterval = setInterval(function() {
            if (!window.BonziHandler || !window.BonziHandler.bonzisCheck) return;
            clearInterval(patchInterval);

            var originalBonzisCheck = window.BonziHandler.bonzisCheck;
            window.BonziHandler.bonzisCheck = function() {
                if (window.usersPublic) {
                    for (var key in window.usersPublic) {
                        var color = window.usersPublic[key].color;
                        if (isCrossColor(color)) {
                            ensureCrossColorSheet(color);
                        }
                    }
                }
                return originalBonzisCheck.apply(this, arguments);
            };
        }, 50);
    });
})();
