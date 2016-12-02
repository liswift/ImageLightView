'use strict';

const React = require('react');
const ReactNative = require('react-native');
const {
    View,
    ScrollView,
    StyleSheet,
    Animated,
    Dimensions,
    Text,
    StatusBar,
    Platform,
    CameraRoll,
    TouchableWithoutFeedback,
    Image
    } = ReactNative;

let winLayout = Dimensions.get('window');
let WIN_WIDTH = winLayout.width,WIN_HEIGHT = winLayout.height;

let ITEM_DIST = 20;
let VIEW_WIDTH = WIN_WIDTH + ITEM_DIST;
let imageLightView = null;

const ImageLightViewImage = React.createClass({
    propTypes:{
        source:React.PropTypes.any,
        largeSource:React.PropTypes.any
    },

    getDefaultProps:function(){
        return {
            source:''
        }
    },

    componentWillUnmount:function(){

    },
    componentWillReceiveProps:function(obj){

        let source = obj.source;
        let index = imageLightView.lightViewImages.indexOf(this);
        let item = imageLightView.refs['image_light_view_item_'+index];
        if(source.uri != this.state.source.uri){
            if(item){
                item.setState({source:source});
            }else{
                this.setState({source:source});
            }
        }
    },
    componentDidMount:function(){
        imageLightView.lightViewImages.push(this);
    },

    getInitialState:function(){
        let source = this.props.source;
        return {
            source:source
        }
    },

    largeImageLoaded:function(largeSource){
        let self = this;
        self.largeImgLoaded = true;
        self.largeSize = self.props.largeSize;
        let index = imageLightView.lightViewImages.indexOf(self);
        let item = imageLightView.refs['image_light_view_item_'+index];
        let mask = imageLightView.refs['item_mask_'+index];
        mask && mask.setNativeProps({style:[styles.itemMaskView,{top:WIN_HEIGHT}]});
        item && item.setState({source:largeSource},function(){
            imageLightView.resizeImageSize(item,self.largeSize);
        });
    },

    smallImageLoaded:function(smallSource){
        let self = this;
        let index = imageLightView.lightViewImages.indexOf(self);
        self.smallImgLoaded = true;
        let item = imageLightView.refs['image_light_view_item_'+index];
        !self.largeImgLoaded && item && imageLightView.resizeImageSize(item,self.props.size);

    },

    render:function(){
        return (
            <TouchableWithoutFeedback onPress={()=>{
                if(Platform.OS != 'ios'){ return;}
                let index = imageLightView.lightViewImages.indexOf(this);
                imageLightView.show(index);
            }}>
                <View>
                    {!!this.props.largeSource && !!this.props.largeSource.uri &&
                    <Image
                        style={{width:1,height:1,opacity:0}}
                        source={this.props.largeSource}
                        onLoad={(a)=>{
                            this.largeImageLoaded(this.props.largeSource);
                        }}
                    />
                    }
                    <Image
                        onLoad={()=>{this.smallImageLoaded(this.props.source)}}
                        ref="image" {...this.props}
                    />
                </View>
            </TouchableWithoutFeedback>
        );
    }
});


const ImageLightViewItem = React.createClass({
    statics:{
        calcSize:function(size){
            if(size.width> WIN_WIDTH){
                return {
                    width:WIN_WIDTH,
                    height:size.height * WIN_WIDTH / size.width
                }
            }
            return {
                width:size.width,
                height:size.height
            }
        }
    },

    getInitialState:function(){
        let source = this.props.source || '';
        let image = imageLightView.lightViewImages[this.props.index] || {};
        let size = ImageLightViewItem.calcSize(image.largeSize || this.props.size);
        this.smallSize = ImageLightViewItem.calcSize(this.props.size);

        if(!image.smallImgLoaded){
            let style = StyleSheet.flatten(image.props.style);
            size = {width:style.width,height:style.height};
        }
        return {
            source:source,
            pan:new Animated.ValueXY({x:0,y:0}),
            widthPan:new Animated.ValueXY({x:size.width,y:size.height}),
            scale:new Animated.Value(1)
        }
    },

    getImageSize: function(source){
        return new Promise((resolve,reject)=>{
            if(source.uri){
                Image.getSize(source.uri,(width,height)=>{
                    resolve({width:width,height:height});
                });
            } else{
                resolve(null);
            }
        });
    },

    render:function(){
        let image = imageLightView.lightViewImages[this.props.index];
        if(!image){return null;}
        let source = image.largeSize ? image.props.largeSource : image.state.source;
        return (
            <Animated.View
                ref="item_view"
                style={[styles.itemView,
                    {width:this.state.widthPan.x,height:this.state.widthPan.y},
                    {top:this.state.pan.y,left:this.state.pan.x}
                ]}
            >
                <Animated.Image
                    ref="image"
                    style={[
                        styles.defaultImgStyle,
                        ImageLightViewItem.calcSize(image.largeSize || this.props.size),
                        {transform:[{scale:this.state.scale}]}
                    ]}
                    source={source}
                />
            </Animated.View>
        );
    }
});

const ScrollTab = React.createClass({
    getInitialState:function(){
        this.currentPage = this.props.initialPage || 0;
        this.lightViewImages = [];
        return {
            groupIndex:0,
            rectWidth:0,
            startFromIndex:0
        };
    },

    goToPage:function(page,animated){
        let offset = page*VIEW_WIDTH;
        this.refs.scroll.scrollTo({x: offset, y: 0,animated:animated===undefined ? true : animated });
    },

    setViewRect:function(groupNum,groupIndex,startFromTotalIndex){
        let self = this;
        let width = groupNum*VIEW_WIDTH;
        self.currentPage = groupIndex;
        self.setState({
            groupIndex:groupIndex,
            rectWidth:width,
            startFromIndex:startFromTotalIndex
        },function(){
            self.goToPage(groupIndex,false);
        });
    },

    render:function(){
        return (
            <View style={{flex:1,width:WIN_WIDTH+ITEM_DIST,flexDirection:'row'}}>
                <ScrollView
                    ref="scroll"
                    pagingEnabled={true}
                    horizontal={true}
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                    automaticallyAdjustContentInsets={false}
                    scrollsToTop={false}
                    directionalLockEnabled={false}
                    keyboardDismissMode="on-drag"
                    alwaysBounceVertical={false}
                    scrollEventThrottle={16}
                    style={{width:WIN_WIDTH,height:WIN_HEIGHT}}
                    //contentContainerStyle={{flex:1}}
                    onScrollBeginDrag={(e)=>{this.props.onScrollBeginDrag(e)}}
                    onScrollEndDrag={(e)=>{this.props.onScrollEndDrag(e)}}
                    onMomentumScrollEnd={(e) => {
                         let page = Math.round(e.nativeEvent.contentOffset.x/VIEW_WIDTH);
                         if(this.currentPage != page){
                             this.currentPage = page;
                             this.props.onChangePage &&  this.props.onChangePage(page,e.nativeEvent);
                         }
                    }}
                >
                    <View style={{width:this.state.rectWidth,overflow:'hidden'}}>
                        <View style={{width:VIEW_WIDTH*this.lightViewImages.length,flexDirection:'row',left:-this.state.startFromIndex*VIEW_WIDTH}}>
                            {this.props.children}
                        </View>
                    </View>
                </ScrollView>
            </View>
        );
    }
});

const ImageLightView = React.createClass({

    statics:{
        Image:ImageLightViewImage
    },

    propTypes:{
        maximumZoomScale:React.PropTypes.number,
        minimumZoomScale:React.PropTypes.number
    },

    getDefaultProps:function(){
        return {
            maximumZoomScale:2,
            minimumZoomScale:1
        }
    },

    getInitialState:function(){
        this.oldTimeStamp = 0;
        this.oldDeltaTime = 0;
        this.isDragged = false;
        this.isParentDragged = false;
        this.clk = undefined;
        this.startClk = undefined;
        this.prevPage = 0;
        this.imageIndex = {groupIndex:0,totalIndex:0};
        this.groupName = null;
        this.lightViewImages = [];
        return {
            page:0,
            top:WIN_HEIGHT,
            opacity:0
        }
    },
    componentDidUpdate:function(){
        imageLightView = this;
    },
    componentDidMount:function(){
        imageLightView = this;
    },
    componentWillMount:function(){
        imageLightView = this;
    },

    isShow:function(){
        return this.state.top == 0;
    },

    preRenderView:function(){

    },
    rebuildView:function(index,callback){
        let self = this;
        let groupName = imageLightView.lightViewImages[index].props.group;
        let newLength = self.findGroup(groupName,index);
        if(groupName != self.groupName){
            self.groupName = groupName;
        }
        self.refs.popScroll.setViewRect(newLength,self.imageIndex.groupIndex,self.imageIndex.totalIndex-self.imageIndex.groupIndex);
        typeof callback == 'function' && callback();

    },

    findGroup:function(groupName,index){
        let i = index- 1,j=index+1;
        let  lightViewImages = imageLightView.lightViewImages;
        let nameLeft = lightViewImages[i] ?lightViewImages[i].props.group : null,
            nameRight = lightViewImages[j] ?lightViewImages[j].props.group : null;
        while (nameLeft == groupName || nameRight == groupName){
            if(nameLeft == groupName){
                i--;
                nameLeft = lightViewImages[i] ?lightViewImages[i].props.group : null;
            }
            if(nameRight == groupName){
                j++;
                nameRight = lightViewImages[j] ?lightViewImages[j].props.group : null;
            }
        }
        this.imageIndex = {groupIndex:index-i-1,totalIndex:index,groupLength:j-i-1};
        return j-i-1;
    },

    show: function(index) {
        let self = this;
        if(self.isAnimating){
            return;
        }
        StatusBar.setHidden(true);
        self.refs.tintView.setNativeProps({style:[styles.itemMaskView,{top:0}]});
        self.rebuildView(index,function(){
            self.setState({opacity:1,page:index-(self.imageIndex.totalIndex - self.imageIndex.groupIndex)},function(){
                self.prevPage = index;
                self.isAnimating = true;
                let imgComp = imageLightView.lightViewImages[index];
                let itemComp =  self.refs['image_light_view_item_'+index];
                let size = ImageLightViewItem.calcSize(imgComp.largeSize || imgComp.props.size);

                if(!imgComp.smallImgLoaded || !imgComp.largeImgLoaded){
                    let mask = self.refs['item_mask_'+index];
                    mask && mask.setNativeProps({style:[styles.itemMaskView,{top:0}]});
                    if(!imgComp.smallImgLoaded && !imgComp.largeImgLoaded){
                        let style = StyleSheet.flatten(imgComp.props.style);
                        size = {width:style.width,height:style.height};
                    }
                }

                imgComp.refs.image.measureInWindow((x, y, width, height) => {

                    let origin = {
                        width,
                        height,
                        x: x - (WIN_WIDTH-width)/2,
                        y: size.height < WIN_HEIGHT ? y-(WIN_HEIGHT-height)/2 : y
                    };
                    let target = {
                        width: size.width,
                        height: size.height,
                        x: 0,
                        y: 0
                    };

                    let scale = size.width>size.height ? height / size.height : width / size.width;

                    itemComp.state.pan.setValue({x:origin.x,y:origin.y});
                    itemComp.state.widthPan.setValue({x:width,y:height});
                    itemComp.state.scale.setValue(scale);
                    self.state.top !=0 && self.setState({top:0});

                    setTimeout(function(){
                        Animated.parallel([
                            Animated.timing(itemComp.state.pan,{
                                toValue: {x:0,y:0},
                                duration:250
                            }),
                            Animated.timing(itemComp.state.widthPan,{
                                toValue: {x:target.width,y:target.height},
                                duration:250
                            }),
                            Animated.timing(itemComp.state.scale,{
                                toValue: 1,
                                duration:250
                            })
                        ]).start(function(){
                            self.isAnimating = false;
                        });
                    },50);

                });
            });
        });

    },

    hide:function(index,callback){

        let self = this;
        if(self.isAnimating){
            return;
        }
        StatusBar.setHidden(false);
        self.refs.tintView.setNativeProps({style:[styles.itemMaskView,{top:WIN_HEIGHT}]});
        self.isAnimating = true;
        let imgComp = imageLightView.lightViewImages[index];
        let itemComp = self.refs['image_light_view_item_'+index];
        let size = ImageLightViewItem.calcSize(imgComp.largeSize || imgComp.props.size);
        imgComp.refs.image.measureInWindow((x, y, width, height) => {
            let origin = {
                width: WIN_WIDTH,
                height: height/width * WIN_WIDTH,
                x: 0,
                y: 0
            };
            let target = {
                width,
                height,
                x: x - (WIN_WIDTH-width)/2,
                y: size.height < WIN_HEIGHT ? y-(WIN_HEIGHT-height)/2 : y
            };

            let scale = size.width>size.height ? height / size.height : width / size.width;

            self.setState({opacity:0});
            self.zoomTo(index,{x:0,y:0,width:self.layout.width,height:self.layout.height,animated:false});
            if((x+width<=0 || x >= WIN_WIDTH || y+height <= 0 || y > WIN_HEIGHT)){
                self.setState({top:WIN_HEIGHT});
                self.isAnimating = false;
            }
            else{
                Animated.parallel([
                    Animated.timing(itemComp.state.pan,{
                        toValue: {x:target.x,y:target.y},
                        duration:300
                    }),
                    Animated.timing(itemComp.state.widthPan,{
                        toValue: {x:target.width,y:target.height},
                        duration:300
                    }),
                    Animated.timing(itemComp.state.scale,{
                        toValue: scale,
                        duration:300
                    })
                ]).start(function(){
                    self.setState({top:WIN_HEIGHT});
                    itemComp.state.pan.setValue({x:0,y:0});
                    itemComp.state.widthPan.setValue({x:size.width,y:size.height});
                    itemComp.state.scale.setValue(1);
                    self.isAnimating = false;
                });
            }
        });

    },

    _onTouchStart:function(e,index,uri){
        let self = this;
        self.isTouchEnd = false;
        self.touchTimeStamp = e.nativeEvent.timestamp;
        if(!self.startClk){
            self.startClk = setTimeout(function(){
                if(self.startClk && !self.isTouchEnd && !self.isDragged && !self.isParentDragged){
                    typeof self.props.onLongTouch == 'function' && self.props.onLongTouch(e,{
                        imageUri:uri.uri,
                        groupName:self.groupName,
                        groupIndex:index
                    });
                }
                clearTimeout(self.startClk);
                self.startClk = null;
            },800);
        }
        else{
            clearTimeout(self.startClk);
            self.startClk = null;
        }
    },

    _onTouchEnd:function(e,page){
        let self = this;
        let evt = e.nativeEvent;
        let zoomPointX =evt.pageX - self.layout.x,
            zoomPointY = evt.pageY - self.layout.y;

        let maximumZoomScale = self.refs['item_scroll_'+page].props.maximumZoomScale,
            minimumZoomScale = self.refs['item_scroll_'+page].props.minimumZoomScale;

        let delta = evt.timestamp - self.oldTimeStamp;

        self.isTouchEnd = true;

        if(self.isAnimating){
            self.oldTimeStamp = evt.timestamp;
            self.oldDeltaTime = delta;
            return;
        }

        if(delta>50 && delta <200 && (self.oldDeltaTime >=250 ||self.oldDeltaTime <= 50)){
            self.refs['item_scroll_'+page]._innerViewRef.measureInWindow(function(x,y,width,height){
                let scale_w = width != WIN_WIDTH ? self.layout.width/minimumZoomScale : self.layout.width/maximumZoomScale;
                let scale_h = width != WIN_WIDTH ? self.layout.height/minimumZoomScale : self.layout.height/maximumZoomScale;
                self.isScrolled = false;
                !self.isDragged && self.zoomTo(page,{x:zoomPointX-scale_w/2,y:zoomPointY-scale_h/2,width:scale_w,height:scale_h,animated:true});
            });
        }

        let timestampDelta = evt.timestamp - self.touchTimeStamp;
        if(delta>50  && timestampDelta < 800 && evt.changedTouches.length == 1 && !self.isDragged && !self.isParentDragged){
            if(!self.clk){
                self.clk = setTimeout(function(){
                    if(self.clk){
                        self.hide(page);
                    }
                    clearTimeout(self.clk);
                    self.clk = null;
                },270);
            }
            else{
                clearTimeout(self.clk);
                self.clk = null;
            }
        }

        self.oldTimeStamp = evt.timestamp;
        self.oldDeltaTime = delta;

    },

    saveImage:function(uri){
        CameraRoll.saveImageWithTag(uri)
            .then(function(result) {
                console.log('save succeeded ' + result);
            }).catch(function(error) {
            console.log('save failed ' + error);
        });
    },

    resizeImageSize:function(item,largeSize){
        let self = this;
        let isCurrentPage = self.imageIndex.totalIndex == item.props.index;
        let size = ImageLightViewItem.calcSize(largeSize);
        let maxScale = self.calcMaxScale(largeSize,size);
        let scroll = self.refs['item_scroll_'+item.props.index];
        self.zoomTo(item.props.index,{x:0,y:0,width:self.layout.width,height:self.layout.height,animated:false});
        if(size.height >= WIN_HEIGHT){
            scroll && scroll.setNativeProps({centerContent:false});
            scroll && scroll.scrollTo({x:0,y:0,animated:true});
        }

        if(!isCurrentPage || !self.isShow()){
            item.state.widthPan.setValue({x:size.width,y:size.height});
            //item.state.scale.setValue(size.width/item.smallSize.width);
            return;
        }
        item.state.scale.setValue(item.smallSize.width/size.width);
        self.isAnimating = true;
        Animated.parallel([
            Animated.timing(item.state.widthPan,{
                toValue: {x:size.width,y:size.height},
                duration:250
            }),
            Animated.timing(item.state.scale,{
                toValue: 1,
                duration:250
            })
        ]).start(function(){
            self.isAnimating = false;
            scroll && scroll.setNativeProps({maximumZoomScale:maxScale});
        });
    },

    zoomTo:function(page,obj){
        let container = this.refs['item_scroll_'+page];
        container && container.isMounted() && container.scrollResponderZoomTo(obj);
    },

    largeImageOnLoad:function(item,largeSize){
        let self = this;
        self.resizeImageSize(item,largeSize);
    },

    onChangePage:function(page){
        let self = this;
        !self.isDragged && self.zoomTo(self.prevPage,{x:0,y:0,width:self.layout.width,height:self.layout.height,animated:false});
        self.prevPage = self.imageIndex.totalIndex-self.imageIndex.groupIndex+page;

        self.setState({page:page});

        let imgComp = imageLightView.lightViewImages[self.prevPage];
        if(!imgComp.smallImgLoaded || !imgComp.largeImgLoaded){
            let mask = self.refs['item_mask_'+self.prevPage];
            mask && mask.setNativeProps({style:[styles.itemMaskView,{top:0}]});
        }

        if(typeof self.props.onChangePage == 'function'){
            self.props.onChangePage({
                groupIndex:page,
                groupName:self.groupName
            });
        }
    },

    calcMaxScale:function(largeSize,smallSize){
        let flat = largeSize.width/WIN_WIDTH > largeSize.height/WIN_HEIGHT;
        let maxScale;
        if(flat){
            maxScale = WIN_HEIGHT/largeSize.height < 1 ? largeSize.height/smallSize.height : WIN_HEIGHT/smallSize.height;
        }
        else{
            maxScale = WIN_WIDTH/largeSize.width < 1 ? largeSize.width/smallSize.width : WIN_WIDTH/smallSize.width;
        }
        return maxScale;
    },

    render:function(){
        let self = this;
        let items = self.lightViewImages.map(function(item,index){
            let size = ImageLightViewItem.calcSize(item.largeSize || item.props.size);
            let maxScale = self.calcMaxScale(item.largeSize || item.props.size ,size );
            let source = item.largeSize ? item.props.largeSource : item.props.source;
            return (
                <View key={'item_scroll_wrap_'+index} style={{width:WIN_WIDTH+ITEM_DIST,height:WIN_HEIGHT}}>
                    <ScrollView
                        ref={"item_scroll_"+index}
                        onLayout={(e)=>{self.layout = e.nativeEvent.layout;}}
                        showsVerticalScrollIndicator={false}
                        showsHorizontalScrollIndicator={false}
                        scrollsToTop={false}
                        onScrollBeginDrag={(e)=>{self.isDragged = true;}}
                        onScrollEndDrag={(e)=>{self.isDragged = false;}}
                        maximumZoomScale={maxScale}
                        minimumZoomScale={1}
                        centerContent={size.height < WIN_HEIGHT}
                        onTouchEnd={(e)=>{self._onTouchEnd(e,index)}}
                        onTouchStart={(e)=>{self._onTouchStart(e,index,source)}}
                        scrollEventThrottle={1}
                        style={{width:WIN_WIDTH,height:WIN_HEIGHT}}
                        contentContainerStyle={{alignItems:'center'}}
                    >
                        <ImageLightViewItem
                            parent={self}
                            ref={'image_light_view_item_'+index}
                            largeImageOnLoad = {self.largeImageOnLoad}
                            source={source}
                            size={item.props.size}
                            index={index}
                        />
                    </ScrollView>
                    {false && <View ref={"item_mask_"+index} pointerEvents="none" style={[styles.itemMaskView,{top:WIN_HEIGHT}]} ><Text style={styles.loadingStyle}>正在加载大图...</Text></View>}
                </View>
            );
        });

        let Tint = React.isValidElement(self.props.tintBar) ?
                    self.props.tintBar :
                    self.props.tintBar == 'default' ?
                    <View style={styles.tintView}>
                        <Text style={styles.tintText}>{self.state.page+1}/{self.imageIndex.groupLength}</Text>
                    </View>
                    :null;

        return (
            <View style={[styles.container,{top:this.state.top}]}>
                <View style={[styles.mask,{opacity:this.state.opacity}]} />
                <ScrollTab
                    ref="popScroll"
                    onChangePage={(page,evt)=>{this.onChangePage(page)}}
                    onScrollBeginDrag={(e)=>{this.isParentDragged = true;}}
                    onScrollEndDrag={(e)=>{this.isParentDragged = false;}}
                >
                    {items}
                </ScrollTab>
                <View ref="tintView" pointerEvents="none" style={[styles.itemMaskView]}>
                    {Tint}
                </View>
            </View>

        );
    }
});

module.exports = ImageLightView;

let styles = StyleSheet.create({
    container:{
        position:'absolute',
        left:0,
        right:0,
        bottom:0
    },
    mask:{
        position:'absolute',
        top:0,
        left:0,
        right:0,
        bottom:0,
        backgroundColor:'#000'
    },
    defaultImgStyle:{
        width:WIN_WIDTH,
        height:WIN_HEIGHT,
        resizeMode:Image.resizeMode.contain
    },
    itemView:{
        alignItems:'center',
        justifyContent:'center',
        overflow:'hidden'
    },
    itemMaskView:{
        position:'absolute',
        top:0,
        left:0,
        right:0,
        bottom:0,
        alignItems:'center',
        justifyContent:'center',
        overflow:'hidden'
    },
    tintView:{
        position:'absolute',
        top:20,
        left:0,
        right:0,
        alignItems:'center',
        justifyContent:'center'
    },
    tintText:{
        color:'#fff',
        fontSize:22,
        backgroundColor:'transparent'
    },
    loadingStyle:{
        color:'#fff',
        backgroundColor:'transparent'
    }
});


