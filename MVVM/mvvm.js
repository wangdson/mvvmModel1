

function MVVM(options = {}) {
  this.$options = options;
  var data = this._data = this.$options.data;
  observe(data);

  //this 代理了 this._data
  for (let key in data) {
    Object.defineProperty(this, key, {
      enumerable: true,
      get(){
        return this._data[key];

      },
      set(newVal){
        this._data[key] = newVal;

      }
    });
  }

  initComputed.call(this);
  new Compile(options.el, this);


}

function initComputed() {
  let vm = this;
  let computed = this.$options.computed;
  Object.keys(computed).forEach(function (key) {
    Object.defineProperty(vm, key, {
      get:typeof computed[key] === 'function' ?  computed[key]: computed[key].get,
      set(){

      }
    })
  });
}

function Compile(el, vm) {
  //el 表示替换的范围
  vm.$el = document.querySelector(el);
  let fragment = document.createDocumentFragment();

  //将app的内容移入到内存中
  while (child = vm.$el.firstChild) {
    fragment.appendChild(child);
  }
  replace(fragment);
  function replace(fragment) {
    Array.from(fragment.childNodes).forEach(function (node) {
      let text = node.textContent;
      let reg = /\{\{(.*)\}\}/g;

      //文本节点
      if (node.nodeType === 3 && reg.test(text)) {
        console.log(RegExp.$1);  //a.a b

        let arr = RegExp.$1.split('.'); //[a,a] [b]
        let val = vm;
        arr.forEach(function (k) {  //vm.a.a/vm.b
          val = val[k];
        });

        new Watcher(vm, RegExp.$1, function (newVal) {  //函数需要接受一个新的值
          node.textContent = text.replace(/\{\{(.*)\}\}/g, newVal);
        });

        //替换的逻辑
        node.textContent = text.replace(/\{\{(.*)\}\}/g, val);
      }

      //元素节点
      if (node.nodeType === 1) {
        let nodeArrs = node.attributes;
        console.log(nodeArrs);
        Array.from(nodeArrs).forEach(function (attr) {
          console.log(attr);
          let name = attr.name;  //'text'
          let exp = attr.value; //'b'
          if (name.indexOf('v-') == 0) { //v-model
            node.value = vm[exp];
          }
          new Watcher(vm, exp, function (newVal) {
            node.value = newVal;  //watcher 触发时候自动将内容放到输入框里
          });

          node.addEventListener('input', function (e) {
            let newVal = e.target.value;
            vm[exp] = newVal;  //调用set 触发 notify 方法
          });
        });
      }
      if (node.childNodes) {
        replace(node);
      }
    });
  }

  vm.$el.appendChild(fragment);
}

//vm.$options
//观察对象给对象增加Object.defineProperty
function Observe(data) {
  let dep = new Dep();
  for (let key in data) {
    let val = data[key];
    observe(val);  //每一个对象进行数据劫持
    //把data属性通过Object.defineProperty的方式 定义属性
    Object.defineProperty(data, key, {
      enumerable: true,
      get(){
        Dep.target && dep.addSub(Dep.target);  //[watcher]
        return val;
      },
      set(newVal){  //更改值的时候
        //设置的值和以前是一样的东西
        if (newVal === val) return;
        val = newVal;  //以后获取值得时候将刚才设置的值丢回去
        observe(newVal);  //新设置的值再进行数据劫持

        dep.notify();  //所有watcher 的update 方法执行
      }
    });
  }
}

function observe(data) {
  if (typeof data !== 'object') return;
  return new Observe(data);
}


//vue 特点不能新增不存在的属性，因为不存在的属性没有get set
//深度响应  因为每次赋予一个新对象时都会给这个新对象增加数据劫持


//发布订阅
function Dep() {
  this.subs = [];
}

Dep.prototype.addSub = function (sub) {
  this.subs.push(sub);
}

Dep.prototype.notify = function () {
  this.subs.forEach(sub => sub.update());
}

function Watcher(vm, exp, fn) {
  this.fn = fn;
  this.vm = vm;
  this.exp = exp;  //添加到订阅中
  Dep.target = this;
  let val = vm;
  let arr = exp.split('.');
  arr.forEach(function (k) {  //this.a.a  调用get 方法
    val = val[k];
  });
  Dep.target = null;
}
Watcher.prototype.update = function () {
  let val = this.vm;
  let arr = this.exp.split('.');
  arr.forEach(function (k) {
    val = val[k];
  });
  this.fn(val);  //newVal
};