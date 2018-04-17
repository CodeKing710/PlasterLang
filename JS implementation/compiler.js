/*
	interpreter.js
	The Plaster Interpreter file with all the necessary
	components to compile a plaster file
	Has limited capabilities due to that JS has limited capabilities
*/
//Error message function
var makeErrMsg = function(msg,text,pos,line) {
	if(arguments.length == 1) {
		//Message just needs shown
		return msg;
	}
	//Do detailed error message with code glimpse of what it is and where
	var glimpse = "";
	for(var j = text.length;j >= 0; j--) {
		//Don't need to go negative for this
		glimpse += text[pos-j];
	}
	return msg + glimpse + "<-HERE\n Error found on line " + line + ", index(Position on line) at " + pos;
};
/*
	/-----------------------------------------------\
	|												|
	|				LEXER FOR PLASTER				|
	|												|
	\-----------------------------------------------/
*/
var lexerP = function(input){
	//Token functions
	var tokens = [],c,i=0;
	var is_,regs,line=1,pos=1;
	var addToken = function(obj){
		//Error checking in case I miss something
		if(obj.type === undefined) {
			throw makeErrMsg("No type input for token object");
			obj.type = null;
		} else if(obj.pos === undefined || obj.line === undefined) {
			throw makeErrMsg("Character Position and line not defined, bailing out");
			obj.pos = null;
			obj.line = null;
		}
		//Make token object and add to token reel
		tokens.push({type:obj.type,value:obj.value,pos:obj.pos,line:obj.line});
	};
	//Token lexing functions
	var next = function(){pos++;return c = input[++i];},peek = function(){return input[i+1];};
	//Token Identification functions
	is_ = function(type,t) {
		var base = ["null","bool","string","num","object","function"];

		//Special types will be iterated through first before the actual types are evaluated
		if(type === "array") {
			return t instanceof Array;
		}
		if(type === "id") {
			//All these should be !false which is true
			return typeof t === "string" && !regs.number.test(t) && !regs.string.test(t) && !regs.operator.test(t) && !regs.logic.test(t) && !regs.keyword.test(t) && !regs.directive.test(t) && !/[=()#;:,\.\s\n\r\t\[\]\{\}`]/.test(t);
		}
		for(var i = 0; i < base.length; i++) {
			if(base[i] === type) {
				return typeof t === base[i];
			}
		}
	};
	regs = {
		operator:/[\+\-\*\/%]/,
		string:/["']/,
		space:/[\s\t]/,
		keyword:/(\bimport\b|\bfrom\b|\bas\b|\bpackage\b|\bclass\b|\bvar\b|\blet\b|\bfunc\b|\bif\b|\belse\b|\belif\b|\btypeof\b|\binstanceof\b|\bpass\b|\binherits\b|\bwrite\b|\bread\b|\bmodule\b|\breturn\b|\bnew\b|\bauth\b|\bstream\b|\bdelete\b|\bblock\b|\bparent\b|\bprivate\b|\bref\b|\bgoto\b|\bfor\b|\bwhile\b|\bdo\b|\bsizeof\b|\bin\b|\benum\b|\bnumber\b|\bstring\b|\bbool\b|\bprototype\b|\bvoid\b|\bswitch\b|\bbreak\b|\bcontinue\b|\bcase\b|\bthis\b|\btrue\b|\bfalse\b|\bnull\b|\bthrow\b|\bhold\b|\bdrop\b)/,
		directive:/(\bmulti\b|\bmode\b|\bstrict\b|\bplaster-auto\b|\boverride\b|\bweb\b|\btalk-low\b|\buse-raw\b|\bgui\b|\bshell\b|\bcross\b|\btouch\b|\boverload\b)/,
		number:/[0-9]/,
		logic:/[\<\>\?&|!\^~]/,
		predef:/(MAIN|SENSOR|SOUND|PERIPHERALS|ARGS|FRAME)/
	};
	for(i,pos;i <= input.length;++i,pos++) {
		c = input[i];
		//Find lines for easy error identification
		if(c === "\n") {
			line++;
			pos = 0;
			continue;
		}
//		console.log("Position: " + i);
//		console.log("Line: " + line);
//		console.log("Character: " + c);
		//Just skip the spaces
		if(regs.space.test(c)) {
			continue;
		}
		//Comments
		else if(c === '`') {
			next();
			while(true) {
				next();
				if(c === '`') {
					break;
				}
			}

			//Will be at the end of the comment so move to the next letter
			continue;
		}
		//Parentheses
		else if(c === '(') {
			addToken({type:"LPAREN",value:c,pos:pos-1,line:line});
		}
		else if(c === ')') {
			addToken({type:"RPAREN",value:c,pos:pos-1,line:line});
		}
		//Operators
		else if(regs.operator.test(c)) {
			if(c === "+") {
				if(peek() === "=") {
					addToken({type:"PLUS_ASSIGN",value:"+=",pos:pos-2,line:line});
					next();
				} else if(peek() === "+") {
					addToken({type:"INC",value:"++",pos:pos-2,line:line});
					next();
				} else {
					addToken({type:"OPERATOR",value:"+",pos:pos-1,line:line});
				}
			}
			else if(c === "-") {
				if(peek() === "=") {
					addToken({type:"MINUS_ASSIGN",value:"-=",pos:pos-2,line:line});
					next();
				} else if(peek() === "-") {
					addToken({type:"DECR",value:"--",pos:pos-2,line:line});
					next();
				} else {
					addToken({type:"OPERATOR",value:"-",pos:pos-1,line:line});
				}
			}
			else if(c === "*") {
				if(peek() === "=") {
					addToken({type:"MUL_ASSIGN",value:"*=",pos:pos-2,line:line});
					next();
				} else {
					addToken({type:"OPERATOR",value:"*",pos:pos-1,line:line});
				}
			}
			else if(c === "*" && peek() === "*") {
				next();
				if(peek() === "=") {
					addToken({type:"EXP_ASSIGN",value:"**=",pos:pos-3,line:line});
					next();
				} else {
					addToken({type:"EXP",value:"**",pos:pos-2,line:line});
				}
			}
			else if(c === "/") {
				if(peek() === "=") {
					addToken({type:"DIV_ASSIGN",value:"/=",pos:pos-2,line:line});
					next();
				} else {
					addToken({type:"OPERATOR",value:"/",pos:pos-1,line:line});
				}
			}
			else if(c === "%") {
				if(peek() === "=") {
					addToken({type:"MOD_ASSIGN",value:"%=",pos:pos-2,line:line});
					next();
				} else {
					addToken({type:"OPERATOR",value:"%",pos:pos-1,line:line});
				}
			}
			continue;
		}
		else if(c === '=') {
			if(peek() === "=") {
				next();
				if(peek() === "=") {
					next();
					addToken({type:"EQ",value:"==",pos:pos-2,line:line});
				} else {
					addToken({type:"STRICT_EQ",value:"===",pos:pos-3,line:line});
				}
			} else {
				addToken({type:"ASSIGN",value:c,pos:pos-1,line:line});
			}
			continue;
		}
		else if(regs.logic.test(c)) {
			//Run Angle Brackets
			if(c == "<") {
				next();
				var angle = c;
				while(next() !== ">") {
					angle += c;
				}
				addToken({type:"ANGLED",value:angle,pos:pos-angle.length,line:line});
			}
			//Logical operators
			else if(c === "<" && peek() === "=") {
				if(peek() === "=") {
					addToken({type:"LESS_EQ",value:"=",pos:pos-2,line:line});
					next();
				} else if(c === "<" && peek() === "<") {
					addToken({type:"SHIFT_LEFT",value:"<<",pos:pos-2,line:line});
					next();
				} else {
					addToken({type:"LESS",value:c,pos:pos-1,line:line});
				}

			}
			else if(c === ">") {
				if(peek() === "=") {
					addToken({type:"GREATER_EQ",value:"=",pos:pos-2,line:line});
					next();
				} else if(c === ">" && peek() === ">") {
					addToken({type:"SHIFT_RIGHT",value:">>",pos:pos-2,line:line});
					next();
				} else {
					addToken({type:"GREATER",value:c,pos:pos-1,line:line});
				}

			}
			else if(c === "&") {
				if(peek() === "&") {
					addToken({type:"AND",value:"&&",pos:pos-2,line:line});
					next();
				}
				 else {
					addToken({type:"BIT_AND",value:c,pos:pos-1,line:line});
				}
			}
			else if(c === "|") {
				if(peek() === "|") {
					addToken({type:"OR",value:"||",pos:pos-2,line:line});
					next();
				} else {
					addToken({type:"BIT_OR",value:c,pos:pos-1,line:line});
				}
			}
			else if(c === "~") {
				addToken({type:"BIT_NOT",value:c,pos:pos-1,line:line});
			}
			else if(c === "^") {
				addToken({type:"BIT_XOR",value:c,pos:pos-2,line:line});
			}
			else if(c === "!") {
				addToken({type:"NOT",value:c,pos:pos-1,line:line});
			}
			else if(c === "?") {
				addToken({type:"TERNARY",value:c,pos:pos-1,line:line});
			}
			continue;
		}
		else if(c === '#') {
			//Deal with directive keywords
			var directive = "";
			while(is_("id",next())) {
				directive += c;
			}
			//Deal specifically with multi
			if(directive === "multi") {
				addToken({type:"D_MULTI",value:directive,pos:pos-directive.length,line:line});
			} else if(regs.directive.test(directive)) {
				addToken({type:"DIRECTIVE",value:directive,pos:pos-directive.length,line:line});
			} else {
				addToken({type:"ERROR",value:"ERROR",pos:pos-directive.length,line:line});
			}
			continue;
		}
		//Other symbols
		else if(c === ';') {
			addToken({type:"SEMI",value:c,pos:pos-1,line:line});
		}
		else if(c === ':') {
			addToken({type:"COLON",value:c,pos:pos-1,line:line});
		}
		else if(c === ',') {
			addToken({type:"SEPARATOR",value:c,pos:pos-1,line:line});
		}
		else if(c === '.') {
			addToken({type:"DOT",value:c,pos:pos-1,line:line});
		}
		//Blocks
		else if(/[\[\]\{\}]/.test(c)) {
			if(c === "[") {
				addToken({type:"O_BRACKET",value:c,pos:pos-1,line:line});
			} else if(c === "]") {
				addToken({type:"C_BRACKET",value:c,pos:pos-1,line:line});
			} else if(c === "{") {
				addToken({type:"O_BRACE",value:c,pos:pos-1,line:line});
			} else {
				addToken({type:"C_BRACE",value:c,pos:pos-1,line:line});
			}
			continue;
		}
		//Numbers
		else if(regs.number.test(c)) {
			var num = c;
			while(regs.number.test(next())) {
				num += c;
			}
			addToken({type:"NUMBER",value:num,pos:pos-num.length,line:line});
			--i;
			continue;
		}
		//String
		else if(regs.string.test(c)) {
			next();
			var str = c;
			while(!regs.string.test(next())) {
				str += c;
			}
			addToken({type:"STRING",value:str,pos:pos-str.length,line:line});
		}
		//IDs, Keywords, and directive phrases
		else {
			//Check end of input first
			if(i >= input.length) {
				addToken({type:"EOF",value:"EOF",pos:pos-1,line:line});
				return tokens;
			}
			//It is an ID, but still go until it isn't
			var data = c;
			while(is_("id",next())) {
				data += c;
			}
			//Check what it is
			if(regs.keyword.test(data)) {
				addToken({type:"KEYWORD",value:data,pos:pos-data.length,line:line});
			} else if(regs.predef.test(data)) {
				addToken({type:"PREDEF",value:data,pos:pos-data.length,line:line});
			} else {
				addToken({type:"ID",value:data,pos:pos-data.length,line:line});
			}
			//Subtract 1 from i since the next() function accidentally sends i forward one too many
			--i;
			continue;
		}
	}
	//Will be done running checks so return tokens
	return tokens;
};
/*
	-	Hello World!
	-	Keywords
	-	Operator Precedence
	-	Built-ins/Pre-defines
	-	Directives
	-	Peripheral Management
	-	Files
	-	I/O, Streams
	-	Types
	-	Supported Semantics
		o	Generic
		o	Statics
		o	Functional
	-	Imports
	-	Objects
	-	Flow Control
	-	Misc
		o	PlastML
		o	Sound
		o	Sensors
		o	Arguments
		o	Graphics

*/
/*
	/-----------------------------------\
	|									|
	|		 PARSER FOR PLASTER			|
	|									|
	\-----------------------------------/
*/
var parseP = function(tokens) {
	var ast = {}; //Not required if we are doing src-src
	for(var i = 0; i < tokens.length;i++) {
		//Parse tokens into usable JS code
		//Check if we are at the end of the token stream
		if(i >= tokens.length) {
			break;
		}
		//Start with keywords
		if(tokens[i].type === "EOF") {
			break;
		}
	}
};
/*
	/-------------------------------------------\
	|											|
	|			INTERPRETER FOR PLASTER			|
	|											|
	\-------------------------------------------/
*/
var interpretP = function(src) {

};
//Symbol Table
var symbolTable = [{type:"function",id:"SOUND",value:SOUND,scope:0,sign:"SOUND()"},{type:"function",id:"GRAPHIC",value:GRAPHIC,scope:0,sign:"GRAPHIC()"}];
var addSymbol = function(symbols) {
	for(var i = 0; i < symbols.length; i++) {
		symbolTable.push({type:symbols[i].type,id:symbols[i].id,value:symbols[i].value,scope:symbols[i].scope,sign:symbols[i].sign});
	}
}
//Predefined Functions
function SOUND(tone,tag) {
	if(tag === undefined) {
		//Generate random number and assign tag
		tag = (Math.floor(Math.random() * 100) + 100);
	}
	//Input an audio tag
	var audio = document.createElement("AUDIO");
	audio.setAttribute('id',tag.toString());
	if(/(a|b|c|d|e|f|g)/.test(tone)) {
		//Get tone
		if(tone == /#/ || tone == /\bsharp\b/) {
			tone.replace(/(\b#\b|\bsharp\b)/,'');
			//Sharp
			audio.setAttribute('src','../tones/sharp/'+tone+'.mp3');
		} else if(tone == "flat") {
			tone.replace(/\bflat\b/,'')
			//Flat
			audio.setAttribute('src','../tones/flat/'+tone+'.mp3');
		} else {
			audio.setAttribute('src','../tones/'+tone+'.mp3');
		}
	} else {
		//Get file
		audio.setAttribute('src',tone);
	}
	//Return the id of the function
	return tag;
}
var graphicCounter = 0;
function GRAPHIC(json) {
	var ctx;
	//Make a graphic spot unless told otherwise
	if(typeof arguments[0] === "string") {
		ctx = document.getElementById(arguments[0]).getContext('2d');
	} else {
		var canvas = document.createElement('canvas');
		canvas.setAttribute('id','g'+graphicCounter);
		document.body.appendChild(canvas);
		ctx = document.getElementById('g'+graphicCounter).getContext('2d');
		graphicCounter++;
	}
	if(arguments.length > 1) {
		for(var i = 0; i < arguments.length; i++) {
			//Make a property array
			var props = [[],[]];
			for(var prop in arguments[i]) {
				prop[0].push(prop);
				prop[1].push(arguments[i][prop]);
			}
			ctx[props[0][i]] = props[1][i];
		}
	} else {
		var props = [[],[]];
		for(var prop in arguments[i]) {
			prop[0].push(prop);
			prop[1].push(arguments[i][prop]);
		}
		for(var i = 0; i < props[0].length;i++) {
			ctx[props[0][i]] = props[1][i];
		}
	}
	return;
}
/*
	/-----------------------------------------------------------------------\
	|																		|
	|						DEBUGGER FOR PLASTER							|
	|																		|
	\-----------------------------------------------------------------------/
*/
var debugP = function(code) {

}
/*
	/-----------------------------------------------------------------------\
	|																		|
	|							LEXER FOR PLASTML							|
	|																		|
	\-----------------------------------------------------------------------/
*/
//Test out JS class functionality for token type
class Token {
	constructor(type,value,pos,line) {
		this.type = type;
		this.value = value;
		this.pos = pos;
		this.line = line;
	}
}
var lexML = function(input) {

	var line = 0;
	var pos=0, i=0,c;
	var keywords = /(\broot\b|)/;
	var attr = /(\bstyle\b|)/;
	for(i;i < input.length;++i,++pos) {
		//Update c
		c = input[i];
		//Line identifier
		if(c == "\n") {
			++line;
			pos = 0;
			continue;
		}
		//Failsafe
		if(i > input.length){break;}
		//Lexeme Generator
		var data = c;
		while(!/[\s\n]/.test(c=input[++i])) {
			data += c;
		}
		var html = "<";
		if(attr.test(data)) {
			html += "\s" + data.replace(/[\[\]]/,"");
		}
		if(keywords.test(data)) {
			//Data taken is valid HTML, use it
			//Assume tag requires end unless it is root
			if(data === "root") {
				html += data;
			} else {
				html += "><" + data;
			}
		} else {
			//Data taken is valid XML, create special document
		}
	}
};
/*
	/-----------------------------------------------------------------------\
	|													                    |
	|							PARSER FOR PLASTML							|
	|																		|
	\-----------------------------------------------------------------------/
*/
var parseML = function(tokens) {

};
/*
	/-----------------------------------------------------------------------\
	|																		|
	|						INTERPRETER FOR PLASTML							|
	|																		|
	\-----------------------------------------------------------------------/
*/
var interpretML = function(src) {

};
/*
	/-----------------------------------------------------------------------\
	|																		|
	|						DEBUGGER FOR PLASTML							|
	|																		|
	\-----------------------------------------------------------------------/
*/
var debugML = function(code) {

}
