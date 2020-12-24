// ============================================================================================================
// W3GEO WEBSITE JAVASCRIPT
// (c)2017-20 W3GEO OG
// ============================================================================================================
jQuery.loadScript = function (url, callback) {
    jQuery.ajax({
        url: url,
        dataType: 'script',
        success: callback,
        async: true
    });
}


var bigimage = {};
var sborig = '';
var curob = null;
var curimg = 0;
var curiidx = 0;
var curimax = 0;
var curiratio = 0;
var scrtsave = 0;

var bgMax = 15;
var bgCount = 0;
var bgAlternate = 0;
var bgArray = [];

var bgFadeTime = 5000;
var bgFadePause = 7000;

$(window).load(initall);

var bgImg = new Image();
bgImg.onload = function(x){
	ImageFader(bgImg.src);
};

// ImageFader
function ImageFader(whatImage) {
	switch (bgAlternate) {
		case 0:
			$('#background1').css('background-image', 'url(' + whatImage + ')');
			$('#background1').fadeIn(10);
			bgAlternate = 2;
		break;
		case 2:
			$('#background2').css('background-image', 'url(' + whatImage + ')');
			$('#background2').fadeIn(bgFadeTime);
			$('#background1').fadeOut(bgFadeTime);
			bgAlternate = 1;
		break;
		case 1:
			$('#background1').css('background-image', 'url(' + whatImage + ')');
			$('#background1').fadeIn(bgFadeTime);
			$('#background2').fadeOut(bgFadeTime);
			bgAlternate = 2;
		break;
	}
	window.setTimeout(function() {
		bgCount = (bgCount + 1) % bgMax;
		bgImg.src = "backgrounds/" + bgArray[bgCount] + '.jpg';
	}, bgFadePause);
};

// Seiteninitialisierung
function initall()
{
	// BG Image Fader Init
	$('body').append('<div id="background1" class="bgfaderimage"></div><div id="background2" class="bgfaderimage"></div>')
	for (var s = 1; s <= bgMax; s++) {
		bgArray.push(s.toString());
	}
	bgArray.sort(function(a,b) {
		return (Math.random() > Math.random()) ? -1 : 1;
	});
	bgImg.src = "backgrounds/" + bgArray[bgCount] + '.jpg';
	
	// Page Transition Effect
	jQuery.easing.def = "easeInExpo";
	$('a').each(function() {
		if ($(this).attr('target') != '_blank')
		{
			var clink = $(this).attr('href').toString();
			$(this).click(function(event){exitpage(event,clink,$(this).hasClass('active'))});        
			$(this).attr('href','')	
		}
    });	
	$('.headernavi').animate({'top':'0px'},300);
//	$('.curtain').animate({'bottom':'-100%'},500,function(){
//		$('.headersection').css('height','100px');
//	});
}

function exitpage(ev,href,forceret)
{
	ev.preventDefault();
	if (forceret) {return;}
	if (($('.revealer').css('display') == 'block') && ($('.navigator').css('display') != 'none'))
	{
		$('.navigator').animate({'height':'1px'},100);
	}


	$('.headersection').css('height','100%');
	$('.headernavi').animate({'top':'-90px'},400);
	$('.curtain').animate({'bottom':'0px'},500,function(){
		document.location = href;
	});

}


// RESPONSIVE MENU
function revealmenu()
{
	if ($('.navigator').css('display') == 'none')
	{
		$('.headersection').css('height','280px');
		$('.navigator').css('display','block');
		$('.navigator').animate({'height':'170px'},300);
	} else
	{
		$('.navigator').animate({'height':'1px'},300,function(){
			$('.headersection').css('height','140px');
			$('.navigator').css('display','none');
		});
	}
}


// REFERENZEN
// REFINIT
function refinit()
{
	$('.oneproject').on('mouseover',function(){onehandler(this,1)});
	$('.oneproject').on('mouseout',function(){onehandler(this,-1)});
	$('.oneproject').on('click',function(){onehandler(this,2)});
	
	$('.oneproject').each(function(){
		var pname = $(this).attr('filename');
		var imax = parseInt($(this).attr('filecount'));
		var iwi = Math.round(100/imax);				
		var t = '';
		bigimage[pname] = 'referenzen/'+pname+'01.jpg';
		$(this).find('.bigimg').css('background-image','url('+bigimage[pname]+')');
		for (var i=1;i<=imax;i++)
		{
			var str = ""+i;
			var cix = "00".substring(0,2-str.length)+str;
			if (typeof($(this).attr('video'+cix)) == 'string')
			{
				t += '<div filename="'+pname+'" filecount="'+imax+'" filecurrent="'+i+'" onClick="videoplay(\''+$(this).attr('video'+cix)+'\')" style="background-image: url(referenzen/thumbs/'+pname+cix+'.jpg)"></div>';
			} else
			{
				t += '<div filename="'+pname+'" filecount="'+imax+'" filecurrent="'+i+'" onClick="zoom(this,2)" style="background-image: url(referenzen/thumbs/'+pname+cix+'.jpg)"></div>';
			}
		}
		$(this).find('.thumbs').html(t);
	});
}

function videoplay(url)
{
	window.open(url);
}

function onehandler(ob,mode,ev)
{
	if (mode == -2)
	{
		ob = $(ob).parent();
		$(ob).toggleClass('active');
		curob = null;
		ev.stopPropagation();
		$(window).scrollTo(scrtsave,200);
	}
	if (mode == 2)
	{
		if (!$(ob).hasClass('active')) {$('.oneproject.active').toggleClass('active');} else {return;}
		$(ob).toggleClass('active');
		var pname = $(ob).attr('filename');
		curob = ob;
		scrtsave = $(window).scrollTop();
		$(window).scrollTo(ob,300,{'offset':-100});
	}
	if (mode == 1)
	{
		var pname = $(ob).attr('filename');
	}
	if (mode == -1)
	{
	}
}

function zoom(ob,mode,ev)
{
	if (mode == 2) // Viewer Init
	{
		curimg = $(ob).attr('filename');
		curimax = parseInt($(ob).attr('filecount'));
		curiidx = parseInt($(ob).attr('filecurrent'));

		$('body').css('overflow','hidden');
		$('.backblur').css('background-image','url(referenzen/'+curimg+'01.jpg)');
		$('.currentimage').css('width','50%');
		$('.currentimage').css('height','4px');
		$('.currentimage').css('left','25%');
		$('.currentimage').css('top','calc(50% - 2px)');

		$('.imageviewer').fadeIn(400,function(){
			$('.currentimage').show();
			zoom(null,5);						
		});
	}
	if (mode == -2)
	{
		var sh = parseInt(($('.imageviewer').height()-4)/2);
		$('.currentimage').css('overflow','hidden');
		$('.imgswitch').hide();
		$('.currentimage').find('img').animate({'opacity': .01},200);
		$('.currentimage').animate({'width':'50%','height':'4px','left': '25%','top':sh},100,function(){
			$('body').css('overflow','auto');
			$('.imageviewer').fadeOut(200);
		});
	}
	if (mode == 5) // Image Box Init
	{
		var str = curiidx.toString();
		var cix = "00".substring(0,2-str.length)+str;
		var h = '<img style="opacity: .01;" src="referenzen/'+curimg+cix+'.jpg" onLoad="zoom(0,6)" width="100%">';
		$('.currentimage').find('img').replaceWith(h);
	}
	if (mode == 6) // Image Box Init
	{
		var iw = $('.currentimage').find('img').first().width();
		var ih = $('.currentimage').find('img').first().height();
		var rt = iw/ih;
		
		var sw = $('.imageviewer').width()-6;
		var sh = $('.imageviewer').height()-6;

		var niw = sw;
		var nih = parseInt(ih*sw/iw);
		if (nih > sh)
		{
			nih = sh;
			niw = parseInt(iw*sh/ih);
		}
		
		$('.currentimage').find('img').animate({'opacity': 1},300);
		$('.currentimage').animate({'width':niw,'height':nih,'left': ((sw+6)-niw)/2,'top':((sh+6)-nih)/2},300,function(){
			$('.currentimage').css('overflow','visible');
			$('.imgswitch').show();
			if (curiidx == 1) {$('.imgswitch.prev').hide()}
			if (curiidx == curimax) {$('.imgswitch.next').hide()}
		});
	}
	if (mode == -1) // Image Back
	{
		curiidx--;
		if (curiidx == 0) {curiidx = curimax}
	}
	if (mode == 1) // Image Back
	{
		curiidx++;
		if (curiidx > curimax) {curiidx = 1}
	}
	if ((mode == 1) || (mode == -1)) // Image Switch...
	{
		var sh = parseInt(($('.imageviewer').height()-4)/2);
		$('.currentimage').css('overflow','hidden');
		$('.imgswitch').hide();
		$('.currentimage').find('img').animate({'opacity': .01},200);
		$('.currentimage').animate({'width':'50%','height':'4px','left': '25%','top':sh},200,function(){
			zoom(null,5);						
		});
	}
}

// =========================================================================================================
// EMAIL HANDLING
// =========================================================================================================
function validateEmail(email) {
	var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return re.test(email);
}

function form_submit()
{
	if ( (!validateEmail(document.mailform.email.value)) || (document.mailform.name.value.length<3) || (document.mailform.nachricht.value.length<10))
	{
		alert('Bitte geben Sie zum Anfragetext (mind. 10 Zeichen) ihren Namen und eine gültige Email-Adresse an!');
	} else
	{
		$.post('mf.php',$('#mailform').serialize(),function(){
			$('#mailform').remove();
			$('#thanks').show();
		});
	}
}

// =========================================================================================================
// COOKIE HANDLING
// =========================================================================================================
function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) != -1) return c.substring(name.length,c.length);
    }
    return null;
}