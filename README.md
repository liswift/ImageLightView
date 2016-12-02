# ImageLightView
A simple image popup viewer with pan and zoom. Like WeChat timeline. Only working in iOS.
<p>
# Usage
Just use ImagePopView.Image instead of Image.Use {uri:"xxx"} instead of {require("../images/7.jpg")} if it's a remote image.
<p>

 
```javascript


	render(){
        return(
            <View style={styles.container}>
                <View style={styles.imageBox}>
                    <ImagePopView.Image style={styles.image} group="group1" size={{width:960,height:640}} source={require("../images/1.jpg")} />
                    <ImagePopView.Image style={styles.image} group="group1" size={{width:1200,height:2241}} source={require("../images/2.jpg")} />
                    <ImagePopView.Image style={styles.image} group="group1" size={{width:960,height:600}} source={require("../images/3.jpg")} />
                </View>
                <View style={styles.imageBox}>
                    <ImagePopView.Image style={styles.image} group="group2" size={{width:640,height:1136}} source={require("../images/7.jpg")} />
                    <ImagePopView.Image style={styles.image} group="group2" size={{width:800,height:800}} source={require("../images/8.jpg")} />
                    <ImagePopView.Image style={styles.image} group="group2" size={{width:640,height:1136}} source={require("../images/9.jpg")} />
                </View>
                <ImageLightView
                    ref="imageLightView"
                    tintBar={'default'}
                    onChangePage={(obj)=>{console.log(obj)}}
                    onLongTouch={(e,obj)=>{alert('save image action')}}
                />

            </View>
        )
    }

```

####ImageLightView.Image:
 
 * SIZE: Size of image, currently required.
 * GROUP: Those ImagePopView.Image's with the same GROUP will be shown in the popup viewer.You can set several GROUPs.
 
####ImageLightView:
Add ImageLightView to your code to init popup viewer.
 
 * TintBar: navigation bar,can be modified.
 * onChangePage: called when animation end.
 * onLongTouch: a long touch callback.
