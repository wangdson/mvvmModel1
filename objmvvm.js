const OP = Object.prototype;

/*
 *  需要重写的数组方法 OAR 是 overrideArrayMethod 的缩写
 */
const OAM = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'];

class ObjModelMode{
    constructor(obj, callback){
        if(OP.toString.call(obj) !== '[object Object]'){
            console.error('This parameter must be an object：' + obj);
        }
        this.$callback = callback;
        let path = ["data"];
        this.observe(obj,path);
    }

    observe(obj,path){
        // 如果发现 监测的对象是数组的话就要调用 overrideArrayProto 方法
        if(OP.toString.call(obj) === '[object Array]'){
            this.overrideArrayProto(obj,path);
        }
        Object.keys(obj).forEach(function(key, index, keyArray){
            var oldVal = obj[key];
            var pathArray = path && path.slice(0);
            if(pathArray){
                pathArray.push(key);
            }else{
                pathArray = [key];
            }
            Object.defineProperty(obj, key, {
                get: function(){
                    return oldVal;
                },
                set: (function(newVal){
                    if(oldVal != newVal){
                        this.$callback(newVal,oldVal,`${path}-${key}`);
                        oldVal = newVal;
                    }
                }).bind(this)
            });

            if(OP.toString.call(obj[key]) === '[object Object]' || OP.toString.call(obj[key]) === '[object Array]'){
                this.observe(obj[key],pathArray);
            }

        }, this);

    }

    // array监听数据变化
    overrideArrayProto(array,path){
         // 保存原始 Array 原型
         var originalProto = Array.prototype,
         // 通过 Object.create 方法创建一个对象，该对象的原型就是Array.prototype
         overrideProto = Object.create(Array.prototype),
         self = this,
         result;
         // 遍历要重写的数组方法
         Object.keys(OAM).forEach(function(key, index, array){
             var method = OAM[index],
             oldArray=[];
             // 使用 Object.defineProperty 给 overrideProto 添加属性，属性的名称是对应的数组函数名，值是函数
             Object.defineProperty(overrideProto, method, {
                 value:function(){
                     oldArray = this.slice(0);
                     console.log(`oldArray:${JSON.stringify(oldArray)}`);
                     var args = [].slice.apply(arguments);
                     // 调用原始 原型 的数组方法
                     result = originalProto[method].apply(this,args);
                     //对新的数组进行监测
                    //  self.observe(this);
                    
                    // 下面是vue源码部分处理
                    let inserted
                    switch (method) {
                        case 'push':
                        case 'unshift':
                          inserted = args
                          break
                        case 'splice':
                          inserted = args.slice(2)
                          break
                      }
                     if (inserted) self.observe(inserted,path)

                     //执行回调 notify模块操作
                     self.$callback(this,oldArray,path);

                     return result;
                 },
                 writable:true,// 是否可写
                 enumerable:false,// 是否能够通过for in 枚举
                 configurable:true // 是否可使用 delete删除
             });
         },this);
         // 最后 让该数组实例的 __proto__ 属性指向 假的原型 overrideProto
         array.__proto__ = overrideProto;
    }
}