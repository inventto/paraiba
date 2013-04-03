Cards = new Meteor.Collection("cards");
Mouses = new Meteor.Collection("mouses");
function get(id){
  return document.getElementById(id).value;
}
function now() {
  return new Date().getTime();
}
function randomColor(){
  return '#'+Math.floor(Math.random()*16777215).toString(16);
}
if (Meteor.isClient) {
  Meteor.subscribe('cards');
  Meteor.subscribe('mouses');
  Meteor.startup(function () {
     Session.set('user', Meteor.uuid());
     Session.set("mouse", Mouses.insert({user: Session.get("user"), color: randomColor()}));
  });
  Template.cards.cards = function () {
    return Cards.find({},{sort: {first_at: -1}});
  };
  Template.mouses.mouses = function () {
    return Mouses.find();
  };

  Template.yourcard.events({
    'click input.add' : function (evt) {
      Cards.insert({
        description: get("description"),
        name: get("name"),
        email: get("email"),
        site: get("site"),
        phone: get("phone"),
        first_at: now()
      });
    }
  });
  Template.card.events({
    'click input.remove' : function () {
      Cards.remove(this._id);
    },
    'click input.first' : function () {
      Cards.update(this._id, {$set: {
        first_at: now()
      }});
    },
    'mouseover': function(evt){
      console.log("mouseover ", evt);
      Mouses.update(Session.get("mouse"), {$set: {over_card: this._id, x: evt.clientX, y: evt.clientY}});
    },
    'mouseout': function(){
      Mouses.update(Session.get("mouse"), {$set: {over_card: null}});
    }
  });

  Template.card.mousesCount = function() {
    return Mouses.find({over_card: this._id}).count();
  };
}

if (Meteor.isServer) {
  Meteor.publish('cards', function () {
    return Cards.find();
  });
  Meteor.publish('mouses', function () {
    return Mouses.find();
  });
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
