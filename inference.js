/**
 * Input must match this state:
 *		All PLURAL-NOUN are PLURAL-NOUN.
 *		No PLURAL-NOUN are PLURAL-NOUN.
 *		Some PLURAL-NOUN are PLURAL-NOUN.
 *		Are All PLURAL-NOUN PLURAL-NOUN?
 *		Are Some PLURAL-NOUN PLURAL-NOUN?
 *		Are Noe PLURAL-NOUN PLURAL-NOUN?
 *		Describe PLURAL-NOUN.
 *
 *
 *	TODO:
 *		transitive descriptions
 *		conflicting truths	
 *
 *
 *	a <= b  ==  all b are a
 *	a <- b  ==  some b are a
 *	a </ b  ==  no b are a
 * 
 *	Tree Structure:
 *		Mammals <= Dogs <= Beagles </ Poodles
 * 
 */

(function(){

	function clog (argument) {
		console.log(argument);
		$("#log").append("<p>"+argument+"</p>");
	}

	function in_array(needle, haystack){
		for(var key in haystack){
			if(needle === haystack[key]){
				return true;
			}
		}
		return false;
	}

	function clean(arr){
		for(var key in arr){
			var statement = arr[key];
			statement = statement.toLowerCase();
			arr[key] = statement.replace(/\W/g, '');
		}
	}

	function printlist(list){
		for(var key in list){
			clog(list[key]);
		}
	}

	function swapRelationalWord(word){
		if(word === "all"){
			return "no";
		} else if(word === "no"){
			return "all";
		} else {
			return word;
		}
	}

	ObjectMap = function(object){
		this.thing = object;
		this.are = [];
		this.may = [];
		this.not = [];
	};

	ObjectMap.prototype.getSubject = function(){
		return this.thing;
	};

	ObjectMap.prototype.getAres = function(){
		return this.are;
	};

	ObjectMap.prototype.getMays = function(){
		return this.may;
	};

	ObjectMap.prototype.getNots = function(){
		return this.not;
	};

	ObjectMap.prototype.relation = function(relation,thing){
		var msg = "Something went wrong adding the relation";
		if(relation === "all"){
			if(_i.tQuery(thing,relation,this.thing,true) === 1){
				msg = "That is a conflicting statement";
			} else if(!in_array(thing,this.are)){
				msg = "OK";
				this.are.push(thing);
			} else {
				msg = "I already knew that";
			}
		} else if (relation === "no"){
			if(!in_array(thing,this.not)){
				msg = "OK";
				this.not.push(thing);
			} else {
				msg = "I already knew that";
			}
		} else if (relation === "some"){
			if(!in_array(thing,this.may)){
				msg = "OK";
				this.may.push(thing);
			} else {
				msg = "I already knew that";
			}
		}
		return msg;
	};


// all can be worked on
	ObjectMap.prototype.transitiveQuery = function(query,relation){
		if(relation === "all"){
			if( in_array(query,this.are) ){
				return 1;
			} else {
				for(var i = 0; i < this.are.length; i++){
					return _i.findOrAdd(this.are[i]).transitiveQuery(query,relation);
				}
			}
		} else if (relation === "no"){
			if( in_array(query,this.not) ){
				return 1;
			} else {
				for(var i = 0; i < this.not.length; i++){
					return _i.findOrAdd(this.not[i]).transitiveQuery(query,relation);
				}
				return -1;
			}
		} else if (relation === "some"){
			if( in_array(query,this.may) ){
				return 1;
			} else {
				for(var i = 0; i < this.may.length; i++){
					return _i.findOrAdd(this.may[i]).transitiveQuery(query,relation);
				}
			}
		}
		return 0;
	};

	ObjectMap.prototype.containsInfoOn = function(subject){
		return in_array(subject,this.are.concat(this.may.concat(this.not)));
	};

	InferenceEngine = function(){
		this.descWords = ["describe"];
		this.questionWords = ["are"];
		this.additiveWords = ["all","no","some"];
		this.breakWords = ["are"];
		this.stateTree = [];
	};

	InferenceEngine.prototype.statement = function(statement) {
		clog(' statement: "'+statement+'"');
		var blocks = statement.split(" ");
		clean(blocks);
		if( this.checkQuerySyntax(blocks) === true){
			return clog(this.tQuery(blocks[2],blocks[1],blocks[3]));
		} else if( this.checkDescSyntax(blocks) === true){
			return printlist(this.describe(blocks[1]));
		} else if(this.checkAddSyntax(blocks) === true){
			var obj = this.findOrAdd(blocks[1]);
			var relative = this.findOrAdd(blocks[3]);
			if(relative.transitiveQuery(blocks[0],obj) === 0){
				return clog(obj.relation(blocks[0],blocks[3]));
			} else {
				return clog("?");
			}
		}
		return clog("Invalid syntax: '"+statement+"'");
	};

	InferenceEngine.prototype.checkFirst = function(blocks){
		var word = blocks[0];
		return in_array(word,this.additiveWords);
	};

	InferenceEngine.prototype.checkAre = function(blocks){
		return in_array(this.breakWords[0],blocks);
	};

	InferenceEngine.prototype.checkAddSyntax = function(blocks){
		return this.checkFirst(blocks) && this.checkAre(blocks) && blocks.length === 4;
	};

	InferenceEngine.prototype.checkQuerySyntax = function(blocks){
		return in_array(blocks[0],this.questionWords) && blocks.length === 4;
	};

	InferenceEngine.prototype.checkDescSyntax = function(blocks){
		return in_array(blocks[0],this.descWords) && blocks.length === 2;
	};

	InferenceEngine.prototype.findOrAdd = function(object){
		if(typeof(this.stateTree[object]) === "undefined"){
			this.stateTree[object] = new ObjectMap(object);
		}
		return this.stateTree[object];
	};

	InferenceEngine.prototype.tQuery = function(object, relation, query,num){
		var retVal = this.findOrAdd(object).transitiveQuery(query,relation);
		if(num === true) return retVal;
		if( retVal === 0){
			return "I dont have enough information to go off of...";
		} else if (retVal === 1){
			return "Yes, " + relation + " " + object + " are " + query;
		} else if (retVal === -1){
			return "No, " + (relation === "no" ? "some" : "not all") + " " + object + " are " + query;
		}
	};

	InferenceEngine.prototype.describe = function(object){
		var subject = this.findOrAdd(object);
		var list = [];
		for(var i = 0; i < subject.getAres().length; i ++){
			list.push("All " + object + " are "+ subject.getAres()[i] + ".");
		}
		for(var i = 0; i < subject.getMays().length; i ++){
			list.push("Some " + object + " are "+ subject.getMays()[i] + ".");
		}
		for(var i = 0; i < subject.getNots().length; i ++){
			list.push("No " + object + " are "+ subject.getNots()[i] + ".");
		}
		return list;
	};

	window._i = new InferenceEngine();


	_i.statement("All mammals are hairy.");
	_i.statement("All dogs are mammals.");
	_i.statement("All beagles are dogs.");
	_i.statement("Are all beagles hairy?");
	_i.statement("All cats are mammals.");
	_i.statement("All cats are hairy.");
	_i.statement("Are all cats dogs?");
// I don't know.
	_i.statement("No cats are dogs.");
	_i.statement("Are all cats dogs?");
// No, not all cats are dogs.
	_i.statement("Are no cats dogs?");
// Yes, no cats are dogs.
	_i.statement("All mammals are dogs.");
// Sorry, that contradicts what I already know.
	_i.statement("Some mammals are brown.");
	_i.statement("Are some mammals dogs?");
// Yes, some mammals are dogs.
	_i.statement("Are some dogs brown?");
// I don't know.
	_i.statement("Some dogs are brown.");
	_i.statement("Are some dogs brown?");
// Yes, some dogs are brown.
	_i.statement("Describe dogs.");
// All dogs are mammals.
// All dogs are hairy.
// No dogs are cats.
// Some dogs are beagles.
// Some dogs are brown animals.
// Some dogs are brown things.
	_i.statement("Are all goldfish mammals?");
// I don't know anything about goldfish.
})();