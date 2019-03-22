/**
 * Created by xudawei on 2018/1/8-21:43.
 */

//发布订阅模式 订阅 发布[fn1,fn2,fn3]

//绑定的方法 都有一个update方法
function Dep() {
  this.subs = [];
}

Dep.prototype.addSub = function (sub) {
  this.subs.push(sub);
}

Dep.prototype.notify = function () {
  this.subs.forEach(sub => sub.update());
}



function Watcher(fn) {  //watcher 是一个类，通过这个类创建的实例都有update 方法
  this.fn = fn;
}
Watcher.prototype.update = function () {
  this.fn();
};

let watcher = new Watcher(function () {  //监听函数
  console.log(1);
})

let dep = new Dep();
dep.addSub(watcher);   //将watcher 放入到数组中
dep.addSub(watcher);

console.log(dep.subs);
dep.notify();
