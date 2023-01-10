
const directiveObj = {
    mounted(el, binding) {
        function callbackFactory(func) {
            return (top, left, x, y) => {
                return func(defaultOptions.target, defaultOptions.handle, { top, left }, { x, y })
            }
        }

        // 获取给定元素的位置信息（top、left）以及鼠标的
        function getPosition(event) {
            const _top = parseFloat(getComputedStyle(target).top) || 0
            const _left = parseFloat(getComputedStyle(target).left) || 0
            const _x = event.pageX
            const _y = event.pageY
            return { _top, _left, _x, _y }
        }

        // 触发回调
        function triggerCb(name, event) {
            const cb = defaultOptions[name]
            if (cb && typeof cb === "function") {
                const { _top, _left, _x, _y } = getPosition(event)
                cb(_top, _left, _x, _y)
            }
        }

        const options = binding.value

        // 是否正在拖曳
        let dragging = false
        let top, left, x, y

        const defaultOptions = {
            handleSelector: el,
            parentSelector: el.parentElement,
            target: el,
            get handle() {
                const selector = this.handleSelector
                if (selector instanceof HTMLElement) {
                    return selector
                } else if (typeof selector === "string") {
                    const el = document.querySelector(selector)
                    if (!el) {
                        throw new Error(`根据传递的选择器 ${selector} 无法获取到dom元素。`)
                    }
                    return el
                } else {
                    throw new Error("handle选项应该传递一个表示CSS选择器的字符串。")
                }
            },
            get parent() {
                const selector = this.parentSelector
                if (selector instanceof HTMLElement) {
                    return selector
                } else if (typeof selector === "string") {
                    const el = document.querySelector(selector)
                    if (!el) {
                        throw new Error(`根据传递的选择器 ${selector} 无法获取到dom元素。`)
                    }
                    return el
                } else {
                    throw new Error("parent选项应该传递一个表示CSS选择器的字符串。")
                }
            },
            onStart: () => { },
            onMoving: () => { },
            onEnd: () => { }
        }

        if (typeof options === "object" && options !== null) {
            const { handle, parent, onStart, onMoving, onEnd } = options
            if (handle) defaultOptions.handleSelector = handle
            if (parent) defaultOptions.parentSelector = parent
            if (onStart && typeof onStart === "function") defaultOptions.onStart = callbackFactory(onStart)
            if (onMoving && typeof onMoving === "function") defaultOptions.onMoving = callbackFactory(onMoving)
            if (onEnd && typeof onEnd === "function") defaultOptions.onEnd = callbackFactory(onEnd)
        } else return

        const target = defaultOptions.target
        const handle = defaultOptions.handle
        const parent = defaultOptions.parent


        // 对需要拖曳的元素进行必要的样式设定
        const position = target.style.position
        if (!["relative", "absolute"].includes(position)) {
            target.style.position = "absolute"
        }

        handle.addEventListener("mousedown", e => {
            dragging = true

            const { _top, _left, _x, _y } = getPosition(e)

            top = _top
            left = _left
            x = _x
            y = _y

            triggerCb("onStart", e)
        })

        handle.addEventListener("mouseup", e => {
            dragging = false

            triggerCb("onEnd", e)
        })

        document.addEventListener("mousemove", e => {
            if (!dragging) return
            e.preventDefault()

            const { _x, _y } = getPosition(e)

            triggerCb("onMoving", e)

            const distanceY = _y - y
            const distanceX = _x - x
            target.style.top = top + distanceY + "px"
            target.style.left = left + distanceX + "px"
        })

        parent.addEventListener("mouseleave", e => {
            if (!dragging) return
            e.preventDefault()
            dragging = false
            triggerCb("onEnd", e)
        })
    }
}

// 以插件的形式使用，在安装插件时注册为全局指令
export const xyDragPlugin = {
    install(app) {
        app.directive("xydrag", directiveObj)
    }
}

export const vXydrag = directiveObj